"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/lib/types";
import CardCell from "./CardCell";

interface Props {
  id: string;
  card: Card;
  showCardNames?: boolean;
  showExpansionName?: boolean;
  showRarityBadge?: boolean;
  showCondition?: boolean;
  previewScale?: number;
  isP9Row?: boolean;
  isLotus?: boolean;
  onClick?: () => void;
}

export default function SortableCard({
  id,
  card,
  showCardNames,
  showExpansionName,
  showRarityBadge,
  showCondition,
  previewScale = 1,
  isP9Row,
  isLotus,
  onClick,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const transformScale = Math.max(previewScale, 0.01);
  const adjustedTransform = transform
    ? {
        ...transform,
        x: transform.x / transformScale,
        y: transform.y / transformScale,
      }
    : null;

  const style = {
    transform: CSS.Transform.toString(adjustedTransform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 50 : "auto" as const,
    flex: 1,
    touchAction: "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "cursor-grabbing" : "cursor-grab"}
      {...attributes}
      {...listeners}
    >
      <div className="group/card relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[7px] top-[7px] z-20 rounded-[6px] border border-white/70 bg-stone-950/70 px-2.5 py-1.5 text-[10px] font-black tracking-[0.08em] text-white opacity-0 shadow-sm backdrop-blur-[1px] transition group-hover/card:opacity-100"
        >
          DRAG
        </div>
        <div className="pointer-events-none absolute right-[7px] top-[40px] z-20 rounded-[6px] border border-white/60 bg-white/90 px-2 py-1 text-[10px] font-bold text-stone-700 opacity-0 shadow-sm transition group-hover/card:opacity-100">
          {card.imageData ? "画像OK" : "画像未取得"}
        </div>
        <div className="pointer-events-none absolute bottom-[7px] left-[7px] z-20 rounded-[6px] border border-white/60 bg-white/90 px-2 py-1 text-[10px] font-bold text-stone-700 opacity-0 shadow-sm transition group-hover/card:opacity-100">
          クリックで編集
        </div>
        <CardCell
          card={card}
          showCardNames={showCardNames}
          showExpansionName={showExpansionName}
          showRarityBadge={showRarityBadge}
          showCondition={showCondition}
          isP9Row={isP9Row}
          isLotus={isLotus}
          onClick={onClick}
        />
      </div>
    </div>
  );
}
