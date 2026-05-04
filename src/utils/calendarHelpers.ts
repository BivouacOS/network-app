export interface CalendarEvent {
  id: string
  summary?: string
  start: { date?: string; dateTime?: string }
}

export function matchContactName(eventTitle: string, contactName: string): boolean {
  const name = contactName.trim()
  if (name.length < 4) return false
  return eventTitle.toLowerCase().includes(name.toLowerCase())
}

export function eventDate(event: CalendarEvent): string {
  return event.start.date ?? event.start.dateTime?.slice(0, 10) ?? ''
}
