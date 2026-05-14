import { describe, it, expect } from 'vitest'
import { buildContactUrl } from './contactHelpers'

describe('buildContactUrl', () => {
  it('builds mailto: for email', () => {
    expect(buildContactUrl('email', 'jane@example.com')).toBe('mailto:jane@example.com')
  })
  it('builds tel: for phone', () => {
    expect(buildContactUrl('phone', '+1-555-0100')).toBe('tel:+1-555-0100')
  })
  it('returns full https URL as-is for linkedin', () => {
    expect(buildContactUrl('linkedin', 'https://linkedin.com/in/jane')).toBe('https://linkedin.com/in/jane')
  })
  it('prepends https:// for linkedin without protocol', () => {
    expect(buildContactUrl('linkedin', 'linkedin.com/in/jane')).toBe('https://linkedin.com/in/jane')
  })
  it('prepends https:// for other without protocol', () => {
    expect(buildContactUrl('other', 'github.com/jane')).toBe('https://github.com/jane')
  })
  it('returns empty string for empty value', () => {
    expect(buildContactUrl('email', '')).toBe('')
  })
  it('trims whitespace before processing', () => {
    expect(buildContactUrl('email', '  jane@example.com  ')).toBe('mailto:jane@example.com')
  })
})
