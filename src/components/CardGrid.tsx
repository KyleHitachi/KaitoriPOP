"use client";

import { useCallback, useMemo } from "react";
import {
  DndContext,
  CollisionDetection,
  closestCenter,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { SheetConfig, GRID_COLS, GRID_ROWS, HIGH_END_SHEET_NAMES } from "@/lib/types";
import { GRID_GAP, GRID_SIDE_PADDING, ROW_LABEL_GAP } from "@/lib/layout-tokens";
import { getSortedCards } from "@/lib/sort-engine";
import SortableCard from "./SortableCard";

interface Props {
  config: SheetConfig;
  previewScale?: number;
  onCardClick?: (cardIndex: number) => void;
  onReorder?: (newSortedOrder: number[]) => void;
}

const pointerFirstCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  return pointerCollisions.length > 0 ? pointerCollisions : closestCenter(args);
};

export default function CardGrid({
  config,
  previewScale = 1,
  onCardClick,
  onReorder,
}: Props) {
  const sortedCards = getSortedCards(config);
  const itemIds = useMemo(
    () => config.sortedOrder.map((originalIndex) => `card-${originalIndex}`),
    [config.sortedOrder]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = itemIds.indexOf(String(active.id));
      const newIndex = itemIds.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = [...config.sortedOrder];
      const [moved] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, moved);
      onReorder?.(newOrder);
    },
    [config.sortedOrder, itemIds, onReorder]
  );

  const rows = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    const isP9Row = HIGH_END_SHEET_NAMES.includes(config.sheetName) && row === 0;
    const rowLabel = config.rowLabels.find((label) => label.row === row);
    const cells = [];

    for (let col = 0; col < GRID_COLS; col++) {
      const index = row * GRID_COLS + col;
      if (index < sortedCards.length) {
        const originalIndex = config.sortedOrder[index];
        cells.push(
          <SortableCard
            key={itemIds[index]}
            id={itemIds[index]}
            card={sortedCards[index]}
            showCardNames={config.showCardNames}
            showExpansionName={config.showExpansionName}
            showRarityBadge={config.showRarityBadge}
            showCondition={config.showCondition}
            previewScale={previewScale}
            isP9Row={isP9Row}
            isLotus={isP9Row && col === 0}
            onClick={() => onCardClick?.(originalIndex)}
          />
        );
      } else {
        cells.push(
          <div key={`empty-${row}-${col}`} className="flex-1 invisible" />
        );
      }
    }

    rows.push(
      <div key={`row-${row}`}>
        {rowLabel?.visible && (
          <div
            className="flex items-center px-[10px] pb-[6px] pt-[2px]"
            style={{ gap: `${ROW_LABEL_GAP}px` }}
          >
            <span className="whitespace-nowrap text-[13px] font-bold uppercase tracking-[2px] text-[#8a6b2f]">
              {rowLabel.text}
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-[#b9953b]/55 to-transparent" />
          </div>
        )}
        <div
          className={`mb-[8px] flex ${isP9Row ? "row-p9-preview" : ""}`}
          style={{ gap: `${GRID_GAP}px` }}
        >
          {cells}
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerFirstCollisionDetection}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={itemIds} strategy={rectSortingStrategy}>
        <div style={{ padding: `0 ${GRID_SIDE_PADDING}px 8px` }}>{rows}</div>
      </SortableContext>
    </DndContext>
  );
}
