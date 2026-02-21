import { isSameDay } from "date-fns"

/**
 * Map legacy named colors to hex values
 */
export const NAMED_TO_HEX = {
  sky: '#38BDF8', amber: '#FBBF24', violet: '#8B5CF6', rose: '#FB7185',
  emerald: '#34D399', orange: '#FB923C', blue: '#3B82F6', green: '#22C55E',
  red: '#EF4444', purple: '#A855F7', pink: '#EC4899', yellow: '#EAB308',
}

/**
 * Normalize a color value: convert legacy named colors to hex, pass hex through
 */
export function normalizeColor(color) {
  if (!color) return '#3B82F6'
  if (color.startsWith('#')) return color
  return NAMED_TO_HEX[color] || '#3B82F6'
}

/**
 * Get inline styles for any color (works for both hex and legacy named)
 */
export function getEventHexStyles(color) {
  const hex = normalizeColor(color)
  return {
    backgroundColor: hex + '20',
    color: hex,
  }
}

/**
 * Get CSS classes for event colors — always returns null now.
 * Kept for API compat but getEventHexStyles is the primary method.
 */
export function getEventColorClasses(color) {
  return null
}

/**
 * Get CSS classes for border radius based on event position in multi-day events
 */
export function getBorderRadiusClasses(isFirstDay, isLastDay) {
  if (isFirstDay && isLastDay) {
    return "rounded" // Both ends rounded
  } else if (isFirstDay) {
    return "rounded-l rounded-r-none" // Only left end rounded
  } else if (isLastDay) {
    return "rounded-r rounded-l-none" // Only right end rounded
  } else {
    return "rounded-none" // No rounded corners
  }
}

/**
 * Check if an event is a multi-day event
 */
export function isMultiDayEvent(event) {
  const eventStart = new Date(event.start)
  const eventEnd = new Date(event.end)
  return event.allDay || !isSameDay(eventStart, eventEnd)
}

/**
 * Filter events for a specific day
 */
export function getEventsForDay(events, day) {
  return events
    .filter((event) => {
      const eventStart = new Date(event.start)
      return isSameDay(day, eventStart)
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
}

/**
 * Sort events with multi-day events first, then by start time
 */
export function sortEvents(events) {
  return [...events].sort((a, b) => {
    const aIsMultiDay = isMultiDayEvent(a)
    const bIsMultiDay = isMultiDayEvent(b)

    if (aIsMultiDay && !bIsMultiDay) return -1
    if (!aIsMultiDay && bIsMultiDay) return 1

    return new Date(a.start).getTime() - new Date(b.start).getTime()
  })
}

/**
 * Get multi-day events that span across a specific day (but don't start on that day)
 */
export function getSpanningEventsForDay(events, day) {
  return events.filter((event) => {
    if (!isMultiDayEvent(event)) return false

    const eventStart = new Date(event.start)
    const eventEnd = new Date(event.end)

    // Only include if it's not the start day but is either the end day or a middle day
    return (
      !isSameDay(day, eventStart) &&
      (isSameDay(day, eventEnd) || (day > eventStart && day < eventEnd))
    )
  })
}

/**
 * Get all events visible on a specific day (starting, ending, or spanning)
 */
export function getAllEventsForDay(events, day) {
  return events.filter((event) => {
    const eventStart = new Date(event.start)
    const eventEnd = new Date(event.end)
    return (
      isSameDay(day, eventStart) ||
      isSameDay(day, eventEnd) ||
      (day > eventStart && day < eventEnd)
    )
  })
}

/**
 * Get all events for a day (for agenda view), sorted by start time
 */
export function getAgendaEventsForDay(events, day) {
  return getAllEventsForDay(events, day)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
}

/**
 * Add hours to a date
 */
export function addHoursToDate(date, hours) {
  const result = new Date(date)
  result.setHours(result.getHours() + hours)
  return result
}
