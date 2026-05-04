import type { AppNode, PersonData } from '../types'
import { matchContactName, eventDate, type CalendarEvent } from '../utils/calendarHelpers'

// Minimal GIS type declarations (loaded dynamically at runtime)
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: TokenClientConfig): TokenClient
          revoke(token: string, done: () => void): void
        }
      }
    }
  }
}

interface TokenClientConfig {
  client_id: string
  scope: string
  callback: (response: TokenResponse) => void
}

interface TokenClient {
  requestAccessToken(opts?: { prompt?: string }): void
  callback: (response: TokenResponse) => void
}

interface TokenResponse {
  access_token: string
  error?: string
  expires_in: number
}

// Module-level singletons — session-only, not persisted
let _tokenClient: TokenClient | null = null
let _accessToken: string | null = null
const _scriptPromises = new Map<string, Promise<void>>()

function loadScript(src: string): Promise<void> {
  if (_scriptPromises.has(src)) return _scriptPromises.get(src)!
  const p = new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(s)
  })
  _scriptPromises.set(src, p)
  return p
}

export async function initGoogleServices(clientId: string): Promise<void> {
  await loadScript('https://accounts.google.com/gsi/client')
  _tokenClient = window.google!.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/tasks',
    ].join(' '),
    callback: () => {},
  })
}

export function requestAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!_tokenClient) { reject(new Error('Google services not initialized')); return }
    _tokenClient.callback = (resp) => {
      if (resp.error) { reject(new Error(resp.error)); return }
      _accessToken = resp.access_token
      resolve(resp.access_token)
    }
    _tokenClient.requestAccessToken({ prompt: '' })
  })
}

export function signOut(): void {
  if (_accessToken) {
    window.google?.accounts.oauth2.revoke(_accessToken, () => {})
    _accessToken = null
  }
}

export function isConnected(): boolean {
  return _accessToken !== null
}

// API fetch with one auto-retry on 401 (token expired) or missing token (HMR drop)
export async function apiFetch<T>(url: string, options: RequestInit = {}, retried = false): Promise<T> {
  if (!_accessToken) {
    if (retried) throw new Error('Not authenticated')
    await requestAccessToken()
    return apiFetch(url, options, true)
  }
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${_accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> ?? {}),
    },
  })
  if (res.status === 401 && !retried) {
    await requestAccessToken()
    return apiFetch(url, options, true)
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${body}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export interface PullResult {
  updates: Array<{ nodeId: string; name: string; lastContact: string }>
}

export async function pullCalendarUpdates(personNodes: AppNode[]): Promise<PullResult> {
  const timeMin = new Date()
  timeMin.setDate(timeMin.getDate() - 90)

  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events')
  url.searchParams.set('timeMin', timeMin.toISOString())
  url.searchParams.set('timeMax', new Date().toISOString())
  url.searchParams.set('singleEvents', 'true')
  url.searchParams.set('orderBy', 'startTime')
  url.searchParams.set('maxResults', '500')

  const data = await apiFetch<{ items?: CalendarEvent[] }>(url.toString())
  const events = data.items ?? []

  const updates: PullResult['updates'] = []

  for (const node of personNodes) {
    if (node.type !== 'person') continue
    const d = node.data as unknown as PersonData

    const matchedEvents = events.filter(e => matchContactName(e.summary ?? '', d.name))
    if (!matchedEvents.length) continue

    const latest = matchedEvents.reduce((best, e) => {
      const date = eventDate(e)
      return date > best ? date : best
    }, '')

    if (latest && latest > (d.lastContact ?? '')) {
      updates.push({ nodeId: node.id, name: d.name, lastContact: latest })
    }
  }

  return { updates }
}

export interface PushResult {
  pushed: number
  deleted: number
  nodeUpdates: Array<{ nodeId: string; gTaskId: string | undefined }>
}

const TASKS_BASE = 'https://tasks.googleapis.com/tasks/v1/lists/@default/tasks'

export async function syncFollowUpTasks(personNodes: AppNode[]): Promise<PushResult> {
  let pushed = 0
  let deleted = 0
  const nodeUpdates: PushResult['nodeUpdates'] = []

  for (const node of personNodes) {
    if (node.type !== 'person') continue
    const d = node.data as unknown as PersonData
    const { gTaskId, nextFollowUp, name, reminderNote } = d

    if (gTaskId && nextFollowUp) {
      await apiFetch(`${TASKS_BASE}/${gTaskId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: `follow up with ${name}`,
          due: `${nextFollowUp}T00:00:00.000Z`,
          notes: reminderNote || null,
        }),
      })
      pushed++
    } else if (!gTaskId && nextFollowUp) {
      const task = await apiFetch<{ id: string }>(TASKS_BASE, {
        method: 'POST',
        body: JSON.stringify({
          title: `follow up with ${name}`,
          due: `${nextFollowUp}T00:00:00.000Z`,
          notes: reminderNote || null,
        }),
      })
      nodeUpdates.push({ nodeId: node.id, gTaskId: task.id })
      pushed++
    } else if (gTaskId && !nextFollowUp) {
      await apiFetch(`${TASKS_BASE}/${gTaskId}`, { method: 'DELETE' })
      nodeUpdates.push({ nodeId: node.id, gTaskId: undefined })
      deleted++
    }
  }

  return { pushed, deleted, nodeUpdates }
}
