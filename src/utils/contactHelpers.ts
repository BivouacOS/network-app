import type { ContactMethod } from '../types'

export function buildContactUrl(method: ContactMethod, value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  switch (method) {
    case 'email': return `mailto:${trimmed}`
    case 'phone': return `tel:${trimmed}`
    case 'linkedin':
    case 'other':
      return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  }
}
