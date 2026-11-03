"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { PREVIEW_CANVAS_HEIGHT, PREVIEW_CANVAS_WIDTH } from "@/lib/layout-tokens";
import { renderBuylistHtml } from "@/lib/html-renderer";
import { resolveCardImageSrc } from "@/lib/card-image";
import { getSortedCards } from "@/lib/sort-engine";

interface Props {
  config: SheetConfig;
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
  const currentStyles = doc.head.querySelectorAll("style");
  next.head.querySelectorAll("style").forEach((style, index) => {
    const current = currentStyles[index];
    if (current && current.textContent !== style.textContent) {
      current.textContent = style.textContent;
    }
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

function CellTarget({
  rect,
  card,
  onClick,
}: {
  rect: CellRect;
  card: Card;
  onClick: () => void;
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

  return (
    <div
      ref={setRefs}
      onClick={onClick}
      className={`group/card absolute rounded-[9px] transition ${
        draggable.isDragging ? "cursor-grabbing bg-white/55" : "cursor-grab"
      } ${isDropTarget ? "outline outline-[4px] outline-offset-2 outline-[#b82020]" : ""}`}
      style={{
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        touchAction: "none",
      }}
      {...draggable.attributes}
      {...draggable.listeners}
    >
      <div aria-hidden="true" className="pointer-events-none absolute right-[7px] top-[7px] rounded-[6px] border border-white/70 bg-stone-950/70 px-2.5 py-1.5 text-[10px] font-black tracking-[0.08em] text-white opacity-0 shadow-sm transition group-hover/card:opacity-100">
        DRAG
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute right-[7px] top-[40px] rounded-[6px] border border-white/60 bg-white/90 px-2 py-1 text-[10px] font-bold text-stone-700 opacity-0 shadow-sm transition group-hover/card:opacity-100">
        {card.imageData || card.imageStatus === "ok"
          ? "画像OK"
          : card.imageStatus === "failed"
            ? "取得失敗"
            : card.imageStatus === "none"
              ? "画像URLなし"
              : "画像未確認"}
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute bottom-[7px] left-[7px] rounded-[6px] border border-white/60 bg-white/90 px-2 py-1 text-[10px] font-bold text-stone-700 opacity-0 shadow-sm transition group-hover/card:opacity-100">
        クリックで編集
      </div>
    </div>
  );
}

export default function BuylistPreview({ config, onCardClick, onReorder }: Props) {
  const html = useMemo(() => renderBuylistHtml(config), [config]);
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
    setCellRects(measureCells(doc));
    setFrameHeight(Math.max(doc.documentElement.scrollHeight, PREVIEW_CANVAS_HEIGHT));
  }, []);

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

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveIndex(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = parseCellId(active.id);
      const newIndex = parseCellId(over.id);
      const newOrder = [...config.sortedOrder];
      const [moved] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, moved);
      onReorder?.(newOrder);
    },
    [config.sortedOrder, onReorder]
  );

  const activeCard = activeIndex === null ? null : sortedCards[activeIndex];

  return (
    <div className="relative" style={{ width: PREVIEW_CANVAS_WIDTH, height: frameHeight }}>
      <iframe
        ref={iframeRef}
        title="買取表プレビュー"
        srcDoc={initialHtml}
        onLoad={handleLoad}
        scrolling="no"
        className="block border-0"
        style={{ width: PREVIEW_CANVAS_WIDTH, height: frameHeight }}
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
                onClick={() => onCardClick?.(config.sortedOrder[rect.sortedIndex])}
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
