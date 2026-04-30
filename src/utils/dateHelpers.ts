import type { FollowUpStatus } from '../types'

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
