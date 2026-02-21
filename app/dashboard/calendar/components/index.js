"use client"

// Component exports
export { AgendaView } from "./agenda-view"
export { DayView } from "./day-view"
export { DraggableEvent } from "./draggable-event"
export { DroppableCell } from "./droppable-cell"
export { EventDialog } from "./event-dialog"
export { EventItem } from "./event-item"
export { EventCalendar } from "./event-calendar"
export { MonthView } from "./month-view"
export { WeekView } from "./week-view"
export { CalendarDndProvider, useCalendarDnd } from "./calendar-dnd-context"
export { CalendarConnectionsPanel } from "./calendar-connections-panel"
export { CalendarConnectionCard } from "./calendar-connection-card"
export { CalendarSyncButton } from "./calendar-sync-button"
export { ExternalEventBadge } from "./external-event-badge"
export { AppleCredentialsDialog } from "./apple-credentials-dialog"
export { CalendarSelectorDialog } from "./calendar-selector-dialog"
export { ColorLegend } from "./color-legend"

// Constants and utility exports
export * from "./constants"
export * from "./utils"

// Hook exports
export * from "../hooks/use-current-time-indicator"
export * from "../hooks/use-event-visibility"

// Note: Types removed for JavaScript compatibility
