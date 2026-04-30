import type { FollowUpMode, FollowUpStatus } from '../types'

export const AUTO_MILESTONE_DAYS = [2, 14, 60] as const

export function computeNextFollowUp(
  connectedDate: string,
  lastContact: string,
  mode: FollowUpMode,
  customIntervalDays: number,
): string {
  if (mode === 'custom') {
    if (!lastContact) return ''
    const base = new Date(lastContact + 'T00:00:00')
    base.setDate(base.getDate() + customIntervalDays)
    return base.toISOString().slice(0, 10)
  }

  if (!connectedDate) return ''
  const connected = new Date(connectedDate + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const days of AUTO_MILESTONE_DAYS) {
    const milestone = new Date(connected)
    milestone.setDate(milestone.getDate() + days)
    if (milestone >= today) return milestone.toISOString().slice(0, 10)
  }
  return ''
}

export interface MilestoneInfo {
  label: string
  date: string
  done: boolean
}

export function getMilestoneStatus(connectedDate: string): MilestoneInfo[] {
  if (!connectedDate) return []
  const connected = new Date(connectedDate + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const defs = [
    { days: 2, label: '2-day check-in' },
    { days: 14, label: '2-week check-in' },
    { days: 60, label: '2-month check-in' },
  ]

  return defs.map(({ days, label }) => {
    const d = new Date(connected)
    d.setDate(d.getDate() + days)
    return { label, date: d.toISOString().slice(0, 10), done: d < today }
  })
}

export function formatDays(days: number): string {
  if (days === 1) return '1 day'
  if (days < 7) return `${days} days`
  if (days === 7) return '1 week'
  if (days < 14) return `${days} days`
  if (days === 14) return '2 weeks'
  if (days === 30) return '1 month'
  if (days < 30) return `${days} days`
  if (days === 60) return '2 months'
  if (days === 90) return '3 months'
  if (days === 180) return '6 months'
  if (days < 60) return `${Math.round(days / 7)} weeks`
  return `${Math.round(days / 30)} months`
}

export function getFollowUpStatus(dateStr: string): FollowUpStatus {
  if (!dateStr) return 'none'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const followUp = new Date(dateStr)
  followUp.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((followUp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'overdue'
  if (diffDays <= 7) return 'soon'
  return 'ok'
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function statusColors(status: FollowUpStatus) {
  switch (status) {
    case 'overdue': return { border: '#ef4444', bg: '#450a0a', badge: 'bg-red-900 text-red-300' }
    case 'soon':    return { border: '#f59e0b', bg: '#451a03', badge: 'bg-amber-900 text-amber-300' }
    case 'ok':      return { border: '#22c55e', bg: '#052e16', badge: 'bg-green-900 text-green-300' }
    case 'none':    return { border: '#334155', bg: '#0f172a', badge: 'bg-slate-800 text-slate-400' }
  }
}
