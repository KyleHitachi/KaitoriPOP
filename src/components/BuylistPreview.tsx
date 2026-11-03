"use client";

import { KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  CollisionDetection,
  closestCenter,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Card, SheetConfig } from "@/lib/types";
import { resolveOutputSize } from "@/lib/output-sizes";
import { PREVIEW_CANVAS_HEIGHT } from "@/lib/layout-tokens";
import { renderBuylistHtml } from "@/lib/html-renderer";
import { resolveCardImageSrc } from "@/lib/card-image";
import { getSortedCards } from "@/lib/sort-engine";

interface Props {
  config: SheetConfig;
  scale?: number;
  onCardClick?: (cardIndex: number) => void;
  onReorder?: (newSortedOrder: number[]) => void;
}

interface CellRect {
  sortedIndex: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

const pointerFirstCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  return pointerCollisions.length > 0 ? pointerCollisions : closestCenter(args);
};

function cellId(sortedIndex: number): string {
  return `cell-${sortedIndex}`;
}

function parseCellId(id: string | number): number {
  return Number(String(id).replace("cell-", ""));
}

// Swap styles and body in place so the iframe keeps its loaded fonts
// instead of reloading (and flashing) on every edit.
function patchDocument(doc: Document, html: string): void {
  const next = new DOMParser().parseFromString(html, "text/html");
  // Match our stylesheet by its marker, not by position: Adobe Fonts
  // inserts its own <style> into the head after the first load.
  const nextStyle = next.head.querySelector("style[data-buylist-style]");
  const currentStyle = doc.head.querySelector("style[data-buylist-style]");
  if (nextStyle && currentStyle && currentStyle.textContent !== nextStyle.textContent) {
    currentStyle.textContent = nextStyle.textContent;
  }

  // Theme fonts come from stylesheet links; keep them in step so a theme
  // switch loads its fonts without reloading the frame.
  const nextLinks = Array.from(next.head.querySelectorAll<HTMLLinkElement>("link[rel=stylesheet]"));
  const nextHrefs = new Set(nextLinks.map((link) => link.href));
  doc.head.querySelectorAll<HTMLLinkElement>("link[rel=stylesheet]").forEach((link) => {
    if (!nextHrefs.has(link.href)) link.remove();
  });
  const currentHrefs = new Set(
    Array.from(doc.head.querySelectorAll<HTMLLinkElement>("link[rel=stylesheet]")).map(
      (link) => link.href
    )
  );
  nextLinks.forEach((link) => {
    if (!currentHrefs.has(link.href)) doc.head.appendChild(doc.importNode(link, true));
  });

  doc.body.innerHTML = next.body.innerHTML;
}

function measureCells(doc: Document): CellRect[] {
  const win = doc.defaultView;
  const scrollX = win?.scrollX ?? 0;
  const scrollY = win?.scrollY ?? 0;

  return Array.from(doc.querySelectorAll<HTMLElement>("[data-sorted-index]")).map(
    (element) => {
      const rect = element.getBoundingClientRect();
      return {
        sortedIndex: Number(element.dataset.sortedIndex),
        left: rect.left + scrollX,
        top: rect.top + scrollY,
        width: rect.width,
        height: rect.height,
      };
    }
  );
}

function describeOverrides(card: Card): string[] {
  const overrides: string[] = [];
  if (card.priceOverride) overrides.push("価格");
  if (card.setLabelOverride) overrides.push("セット表記");
  if (card.rarityOverride) overrides.push("レアリティ");
  if (card.foilOverride !== undefined) overrides.push("Foil");
  if (card.landOverride !== undefined) overrides.push("Land");
  return overrides;
}

function describeImageStatus(card: Card): string {
  if (card.imageData || card.imageStatus === "ok") return "画像OK";
  if (card.imageStatus === "failed") return "取得失敗";
  if (card.imageStatus === "none") return "画像URLなし";
  return "画像未確認";
}


// The overlay lives inside the scaled preview, so on-card UI is sized by
// 1/scale to stay readable at "全体" (about 50%).
function CellTarget({
  rect,
  card,
  scale,
  cols,
  onClick,
  onMove,
}: {
  rect: CellRect;
  card: Card;
  scale: number;
  cols: number;
  onClick: () => void;
  onMove: (delta: number) => void;
}) {
  const id = cellId(rect.sortedIndex);
  const draggable = useDraggable({ id });
  const droppable = useDroppable({ id });
  const { setNodeRef: setDragRef } = draggable;
  const { setNodeRef: setDropRef } = droppable;
  const setRefs = useCallback(
    (node: HTMLElement | null) => {
      setDragRef(node);
      setDropRef(node);
    },
    [setDragRef, setDropRef]
  );
  const isDropTarget = droppable.isOver && !draggable.isDragging;
  const ui = (px: number) => px / Math.max(scale, 0.2);
  const overrides = describeOverrides(card);
  const name = card.nameJp || card.nameEn;
  const badgeStyle = {
    fontSize: ui(11),
    padding: `${ui(3)}px ${ui(7)}px`,
    borderRadius: ui(6),
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onClick();
      return;
    }
    const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -cols, ArrowDown: cols }[
      event.key as "ArrowLeft"
    ];
    if (event.altKey && delta !== undefined) {
      event.preventDefault();
      onMove(delta);
    }
  };

  return (
    <div
      ref={setRefs}
      data-cell-index={rect.sortedIndex}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`group/card absolute rounded-[9px] transition focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#1d4ed8] ${
        draggable.isDragging ? "cursor-grabbing bg-white/55" : "cursor-grab"
      } ${isDropTarget ? "outline outline-offset-2 outline-[#b82020]" : ""}`}
      style={{
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        touchAction: "none",
        outlineWidth: ui(3),
      }}
      {...draggable.attributes}
      {...draggable.listeners}
      aria-label={`${rect.sortedIndex + 1}番目: ${name}${
        overrides.length > 0 ? `（${overrides.join("・")}を修正済み）` : ""
      }。Enterで編集、Alt+矢印キーで移動`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute flex flex-col items-end opacity-0 transition group-hover/card:opacity-100 group-focus-visible/card:opacity-100"
        style={{ right: ui(6), top: ui(6), gap: ui(4) }}
      >
        <div
          className="border border-white/70 bg-stone-950/75 font-black tracking-[0.06em] text-white shadow-sm"
          style={badgeStyle}
        >
          ドラッグで移動
        </div>
        <div
          className="border border-white/60 bg-white/90 font-bold text-stone-700 shadow-sm"
          style={badgeStyle}
        >
          {describeImageStatus(card)}
        </div>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute border border-white/60 bg-white/90 font-bold text-stone-700 opacity-0 shadow-sm transition group-hover/card:opacity-100 group-focus-visible/card:opacity-100"
        style={{ ...badgeStyle, left: ui(6), bottom: ui(6) }}
      >
        クリックで編集
      </div>
      {overrides.length > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute border border-amber-200 bg-amber-400 font-black text-stone-950 shadow-sm"
          style={{ ...badgeStyle, right: ui(6), bottom: ui(6) }}
        >
          修正済み
        </div>
      )}
    </div>
  );
}

export default function BuylistPreview({ config, scale = 1, onCardClick, onReorder }: Props) {
  const html = useMemo(() => renderBuylistHtml(config), [config]);
  const size = resolveOutputSize(config.outputSize);
  const canvasWidth = size.width;
  const sortedCards = useMemo(() => getSortedCards(config), [config]);
  // srcDoc is fixed at mount; later changes are patched in place.
  const [initialHtml] = useState(html);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const appliedHtmlRef = useRef<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [cellRects, setCellRects] = useState<CellRect[]>([]);
  const [frameHeight, setFrameHeight] = useState(PREVIEW_CANVAS_HEIGHT);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const measure = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc?.body) return;
    (doc.defaultView as (Window & { __fitPanel?: () => void }) | null)?.__fitPanel?.();
    setCellRects(measureCells(doc));
    setFrameHeight(
      size.height ?? Math.max(doc.documentElement.scrollHeight, PREVIEW_CANVAS_HEIGHT)
    );
  }, [size.height]);

  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!loaded || !doc) return;
    if (appliedHtmlRef.current !== html) {
      patchDocument(doc, html);
      appliedHtmlRef.current = html;
    }
    measure();
  }, [html, loaded, measure]);

  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    const win = doc?.defaultView as (Window & typeof globalThis) | null | undefined;
    if (!loaded || !doc || !win) return;

    // Fonts and images arrive after the first paint and can shift the layout.
    const observer = new win.ResizeObserver(measure);
    observer.observe(doc.body);
    doc.addEventListener("load", measure, true);
    doc.fonts?.addEventListener("loadingdone", measure);

    return () => {
      observer.disconnect();
      doc.removeEventListener("load", measure, true);
      doc.fonts?.removeEventListener("loadingdone", measure);
    };
  }, [loaded, measure]);

  const handleLoad = useCallback(() => {
    appliedHtmlRef.current = initialHtml;
    setLoaded(true);
  }, [initialHtml]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveIndex(parseCellId(event.active.id));
  }, []);

  const moveCard = useCallback(
    (oldIndex: number, newIndex: number) => {
      if (oldIndex === newIndex) return;
      const newOrder = [...config.sortedOrder];
      const [moved] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, moved);
      onReorder?.(newOrder);
    },
    [config.sortedOrder, onReorder]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveIndex(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      moveCard(parseCellId(active.id), parseCellId(over.id));
    },
    [moveCard]
  );

  // Keyboard moves keep focus on the card that moved.
  const pendingFocusRef = useRef<number | null>(null);
  const handleKeyboardMove = useCallback(
    (sortedIndex: number, delta: number) => {
      const target = Math.min(
        Math.max(sortedIndex + delta, 0),
        config.sortedOrder.length - 1
      );
      if (target === sortedIndex) return;
      pendingFocusRef.current = target;
      moveCard(sortedIndex, target);
    },
    [config.sortedOrder.length, moveCard]
  );

  useEffect(() => {
    if (pendingFocusRef.current === null) return;
    const target = document.querySelector<HTMLElement>(
      `[data-cell-index="${pendingFocusRef.current}"]`
    );
    pendingFocusRef.current = null;
    target?.focus();
  }, [cellRects]);

  const activeCard = activeIndex === null ? null : sortedCards[activeIndex];

  return (
    <div className="relative" style={{ width: canvasWidth, height: frameHeight }}>
      <iframe
        ref={iframeRef}
        title="買取表プレビュー"
        srcDoc={initialHtml}
        onLoad={handleLoad}
        scrolling="no"
        className="block border-0"
        style={{ width: canvasWidth, height: frameHeight }}
      />
      <DndContext
        sensors={sensors}
        collisionDetection={pointerFirstCollisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveIndex(null)}
      >
        <div className="absolute inset-0">
          {cellRects.map((rect) => {
            const card = sortedCards[rect.sortedIndex];
            if (!card) return null;
            return (
              <CellTarget
                key={cellId(rect.sortedIndex)}
                rect={rect}
                card={card}
                scale={scale}
                cols={size.cols}
                onClick={() => onCardClick?.(config.sortedOrder[rect.sortedIndex])}
                onMove={(delta) => handleKeyboardMove(rect.sortedIndex, delta)}
              />
            );
          })}
        </div>
        <DragOverlay>
          {activeCard ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveCardImageSrc(activeCard)}
              alt=""
              className="h-full w-full rounded-[9px] object-cover opacity-90 shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
