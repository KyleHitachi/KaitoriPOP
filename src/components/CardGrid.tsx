"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { SheetConfig, GRID_COLS, GRID_ROWS, HIGH_END_SHEET_NAMES } from "@/lib/types";
import { GRID_GAP, GRID_SIDE_PADDING, ROW_LABEL_GAP } from "@/lib/layout-tokens";
import { getSortedCards } from "@/lib/sort-engine";
import SortableCard from "./SortableCard";
import CardCell from "./CardCell";

interface Props {
  config: SheetConfig;
  onCardClick?: (cardIndex: number) => void;
  onReorder?: (newSortedOrder: number[]) => void;
}

export default function CardGrid({ config, onCardClick, onReorder }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sortedCards = getSortedCards(config);
  const itemIds = useMemo(
    () => config.sortedOrder.map((_, index) => `card-${index}`),
    [config.sortedOrder]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
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

  const activeCard = useMemo(() => {
    if (!activeId) return null;
    const index = itemIds.indexOf(activeId);
    if (index === -1) return null;
    return sortedCards[index];
  }, [activeId, itemIds, sortedCards]);

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
            isP9Row={isP9Row}
            isLotus={isP9Row && col === 0}
            updatedAtText={config.updatedAtText}
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
            <span className="whitespace-nowrap text-[13px] font-bold uppercase tracking-[2px] text-amber-700">
              {rowLabel.text}
            </span>
            <span className="flex-1 h-px bg-gradient-to-r from-amber-600/35 to-transparent" />
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
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={itemIds} strategy={rectSortingStrategy}>
        <div style={{ padding: `0 ${GRID_SIDE_PADDING}px 8px` }}>{rows}</div>
      </SortableContext>
      <DragOverlay dropAnimation={null}>
        {activeCard && (
          <div className="w-[198px] opacity-90 rotate-1 scale-[1.02]">
            <CardCell
              card={activeCard}
              showCardNames={config.showCardNames}
              updatedAtText={config.updatedAtText}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
