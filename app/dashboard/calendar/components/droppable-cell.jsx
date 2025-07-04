"use client";

import { useDroppable } from "@dnd-kit/core";

import { useCalendarDnd } from "./index";
import { cn } from "@/src/lib/utils";

// DroppableCell props converted to JSDoc
/**
 * @param {string} id
 * @param {Date} date
 * @param {number} time - For week/day views, represents hours (e.g., 9.25 for 9:15)
 * @param {React.ReactNode} children
 * @param {string} className
 * @param {Function} onClick
 */

export function DroppableCell({
  id,
  date,
  time,
  children,
  className,
  onClick,
}) {
  const { activeEvent } = useCalendarDnd();

  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      date,
      time,
    },
  });

  // Format time for display in tooltip (only for debugging)
  const formattedTime =
    time !== undefined
      ? `${Math.floor(time)}:${Math.round((time - Math.floor(time)) * 60)
          .toString()
          .padStart(2, "0")}`
      : null;

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={cn(
        "data-dragging:bg-accent flex h-full flex-col overflow-hidden px-0.5 py-1 sm:px-1",
        className
      )}
      title={formattedTime ? `${formattedTime}` : undefined}
      data-dragging={isOver && activeEvent ? true : undefined}
    >
      {children}
    </div>
  );
}
