import { describe, it, expect } from 'vitest'
import { matchContactName, eventDate } from './calendarHelpers'
import type { CalendarEvent } from './calendarHelpers'

describe('matchContactName', () => {
  it('matches exact full name substring', () => {
    expect(matchContactName('Lunch with Alex Kirk', 'Alex Kirk')).toBe(true)
  })

  it('matches case-insensitively', () => {
    expect(matchContactName('Meeting with ALEX KIRK today', 'Alex Kirk')).toBe(true)
  })

  it('returns false when name not in title', () => {
    expect(matchContactName('Team standup', 'Alex Kirk')).toBe(false)
  })

  it('skips names shorter than 4 characters', () => {
    expect(matchContactName('Call with Tim', 'Tim')).toBe(false)
  })

  it('skips names exactly 3 characters', () => {
    expect(matchContactName('See Bob tomorrow', 'Bob')).toBe(false)
  })

  it('matches names exactly 4 characters', () => {
    expect(matchContactName('Call with John', 'John')).toBe(true)
  })

  it('returns false for empty event title', () => {
    expect(matchContactName('', 'Alex Kirk')).toBe(false)
  })

  it('trims whitespace from contact name', () => {
    expect(matchContactName('Meeting with Alex Kirk', '  Alex Kirk  ')).toBe(true)
  })
})

describe('eventDate', () => {
  it('returns date field when present', () => {
    const event: CalendarEvent = { id: '1', summary: 'Test', start: { date: '2026-04-10' } }
    expect(eventDate(event)).toBe('2026-04-10')
  })

  it('extracts date portion from dateTime', () => {
    const event: CalendarEvent = { id: '1', summary: 'Test', start: { dateTime: '2026-04-10T14:00:00Z' } }
    expect(eventDate(event)).toBe('2026-04-10')
  })

  it('returns empty string when neither field present', () => {
    const event: CalendarEvent = { id: '1', start: {} }
    expect(eventDate(event)).toBe('')
  })
})
