"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/lib/types";
import CardCell from "./CardCell";

interface Props {
  id: string;
  card: Card;
  showCardNames?: boolean;
  isP9Row?: boolean;
  isLotus?: boolean;
  updatedAtText?: string;
  onClick?: () => void;
}

export default function SortableCard({
  id,
  card,
  showCardNames,
  isP9Row,
  isLotus,
  updatedAtText,
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 50 : "auto" as const,
    flex: 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CardCell
        card={card}
        showCardNames={showCardNames}
        isP9Row={isP9Row}
        isLotus={isLotus}
        updatedAtText={updatedAtText}
        onClick={onClick}
      />
    </div>
  );
}
