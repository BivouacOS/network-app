# Google Calendar Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bidirectional Google Calendar/Tasks integration — push follow-up reminders as Google Tasks, pull calendar event dates to update `lastContact` on contacts.

**Architecture:** Pure client-side using Google Identity Services (GIS) for OAuth token flow and raw `fetch` against Google Calendar REST API + Google Tasks REST API. No backend needed. Auth token is session-only (not persisted). Manual sync trigger via toolbar button.

**Tech Stack:** React 19 + TypeScript, Zustand, GIS (`https://accounts.google.com/gsi/client` loaded dynamically), Google Calendar API v3, Google Tasks API v1, Vitest

---

## Prerequisites (manual — complete before starting tasks)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable **Google Calendar API** and **Google Tasks API**
4. Create **OAuth 2.0 Client ID** credentials (type: Web Application)
5. Add `http://localhost:5173` (and 5174/5175 as needed) to **Authorized JavaScript origins**
6. Copy the Client ID
7. Create `network-app/.env.local` with:
   ```
   VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   ```
   This file is gitignored — never commit it.

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/utils/calendarHelpers.ts` | Pure helper: name matching, event date extraction |
| Create | `src/utils/calendarHelpers.test.ts` | Unit tests for name matching |
| Create | `src/services/googleCalendar.ts` | GIS init/auth, Calendar pull, Tasks push |
| Create | `src/components/CalendarSync.tsx` | Toolbar button + sync result UI |
| Modify | `src/types/index.ts` | Add `gTaskId?: string` to `PersonData` |
| Modify | `src/components/Toolbar.tsx` | Add `calendarSync?: React.ReactNode` prop |
| Modify | `src/App.tsx` | Pass `<CalendarSync />` to Toolbar |

---

## Task 1: Add `gTaskId` to PersonData

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add the field**

In `src/types/index.ts`, add `gTaskId?: string` to `PersonData` after `interactionCount`:

```typescript
export interface PersonData {
  nodeType: 'person'
  name: string
  contactCategory: ContactCategory
  company: string
  relationship: RelationshipType | ''
  contactMethod: ContactMethod
  contactValue: string
  connectedDate: string
  lastContact: string
  nextFollowUp: string
  reminderNote: string
  location: string
  followUpMode: FollowUpMode
  customIntervalDays: number
  interactionCount: number
  gTaskId?: string
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd ~/projects/network-app && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add gTaskId field to PersonData for Google Tasks sync"
```

---

## Task 2: Name matching util + tests

**Files:**
- Create: `src/utils/calendarHelpers.ts`
- Create: `src/utils/calendarHelpers.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/calendarHelpers.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd ~/projects/network-app && npx vitest run src/utils/calendarHelpers.test.ts
```

Expected: FAIL — `calendarHelpers` module not found.

- [ ] **Step 3: Create the implementation**

Create `src/utils/calendarHelpers.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
cd ~/projects/network-app && npx vitest run src/utils/calendarHelpers.test.ts
```

Expected: all 9 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/calendarHelpers.ts src/utils/calendarHelpers.test.ts
git commit -m "feat: add calendar name matching util with tests"
```

---

## Task 3: Google Calendar service — init & auth

**Files:**
- Create: `src/services/googleCalendar.ts`

- [ ] **Step 1: Create the service file with GIS types, init, and auth**

Create `src/services/googleCalendar.ts`:

```typescript
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

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(s)
  })
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

// API fetch with one auto-retry on 401 (token expired)
export async function apiFetch<T>(url: string, options: RequestInit = {}, retried = false): Promise<T> {
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd ~/projects/network-app && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/services/googleCalendar.ts
git commit -m "feat: add Google services init/auth layer with GIS token flow"
```

---

## Task 4: Google Calendar service — pull

**Files:**
- Modify: `src/services/googleCalendar.ts`

- [ ] **Step 1: Add pull types and `pullCalendarUpdates` to the service**

First, add these two import lines at the top of `src/services/googleCalendar.ts` (after any existing blank lines, before the `declare global` block):

```typescript
import type { AppNode, PersonData } from '../types'
import { matchContactName, eventDate, type CalendarEvent } from '../utils/calendarHelpers'
```

Then append the following to the end of `src/services/googleCalendar.ts` (after the `apiFetch` function):

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd ~/projects/network-app && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/services/googleCalendar.ts
git commit -m "feat: add calendar pull — fetch events and update lastContact by name match"
```

---

## Task 5: Google Calendar service — push (Tasks API)

**Files:**
- Modify: `src/services/googleCalendar.ts`

- [ ] **Step 1: Add push types and `syncFollowUpTasks` to the service**

Append the following to `src/services/googleCalendar.ts` (after `pullCalendarUpdates`):

```typescript
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
          title: `Follow up: ${name}`,
          due: `${nextFollowUp}T00:00:00.000Z`,
          notes: reminderNote || undefined,
        }),
      })
      pushed++
    } else if (!gTaskId && nextFollowUp) {
      const task = await apiFetch<{ id: string }>(TASKS_BASE, {
        method: 'POST',
        body: JSON.stringify({
          title: `Follow up: ${name}`,
          due: `${nextFollowUp}T00:00:00.000Z`,
          notes: reminderNote || undefined,
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd ~/projects/network-app && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/services/googleCalendar.ts
git commit -m "feat: add Tasks API push — create/update/delete follow-up tasks"
```

---

## Task 6: CalendarSync UI component

**Files:**
- Create: `src/components/CalendarSync.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/CalendarSync.tsx`:

```typescript
import { useState, useEffect } from 'react'
import { Calendar, RefreshCw, X } from 'lucide-react'
import { useNetworkStore } from '../store/networkStore'
import {
  initGoogleServices,
  requestAccessToken,
  signOut,
  pullCalendarUpdates,
  syncFollowUpTasks,
  type PullResult,
  type PushResult,
} from '../services/googleCalendar'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

interface SyncResult {
  pushed: number
  deleted: number
  pulled: number
}

const btn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
  cursor: 'pointer', transition: 'all 0.15s', border: 'none',
}

export function CalendarSync() {
  const { nodes, updateNode } = useNetworkStore()
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const [result, setResult] = useState<SyncResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!CLIENT_ID) return
    initGoogleServices(CLIENT_ID).catch(() => setError('Google services unavailable'))
  }, [])

  if (!CLIENT_ID) return null

  async function handleConnect() {
    setConnecting(true)
    setError(null)
    try {
      await requestAccessToken()
      setConnected(true)
    } catch {
      // user cancelled or denied — stay disconnected silently
    } finally {
      setConnecting(false)
    }
  }

  function handleDisconnect() {
    signOut()
    setConnected(false)
    setResult(null)
    setLastSynced(null)
    setError(null)
  }

  async function handleSync() {
    setSyncing(true)
    setError(null)
    setResult(null)
    try {
      const personNodes = nodes.filter(n => n.type === 'person')

      const pushResult: PushResult = await syncFollowUpTasks(personNodes)
      for (const u of pushResult.nodeUpdates) {
        updateNode(u.nodeId, { gTaskId: u.gTaskId })
      }

      const pullResult: PullResult = await pullCalendarUpdates(personNodes)
      for (const u of pullResult.updates) {
        updateNode(u.nodeId, { lastContact: u.lastContact })
      }

      setLastSynced(new Date())
      setResult({
        pushed: pushResult.pushed,
        deleted: pushResult.deleted,
        pulled: pullResult.updates.length,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  if (!connected) {
    return (
      <button
        onClick={handleConnect}
        disabled={connecting}
        style={{ ...btn, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8' }}
      >
        <Calendar size={13} />
        {connecting ? 'Connecting…' : 'Connect Google'}
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        onClick={handleSync}
        disabled={syncing}
        style={{ ...btn, background: '#16a34a18', border: '1px solid #16a34a44', color: '#86efac' }}
      >
        <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
        {syncing ? 'Syncing…' : 'Sync Calendar'}
      </button>

      {lastSynced && !result && !error && (
        <span style={{ fontSize: 11, color: 'rgba(147,197,253,0.35)' }}>
          {formatRelative(lastSynced)}
        </span>
      )}

      {result && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(147,197,253,0.55)' }}>
          <span>↑ {result.pushed} pushed · ↓ {result.pulled} updated</span>
          <button
            onClick={() => setResult(null)}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0, lineHeight: 1 }}
          >
            <X size={11} />
          </button>
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#f87171' }}>
          <span>{error}</span>
          <button
            onClick={handleSync}
            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 11, padding: 0, textDecoration: 'underline' }}
          >
            Retry
          </button>
          <button
            onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0, lineHeight: 1 }}
          >
            <X size={11} />
          </button>
        </div>
      )}

      <button
        onClick={handleDisconnect}
        style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 11, padding: '2px 4px' }}
      >
        Disconnect
      </button>
    </div>
  )
}

function formatRelative(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins === 1) return '1 min ago'
  if (mins < 60) return `${mins} min ago`
  return `${Math.floor(mins / 60)}h ago`
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd ~/projects/network-app && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/CalendarSync.tsx
git commit -m "feat: add CalendarSync toolbar component with connect/sync/error states"
```

---

## Task 7: Wire CalendarSync into Toolbar and App

**Files:**
- Modify: `src/components/Toolbar.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add `calendarSync` prop to Toolbar**

In `src/components/Toolbar.tsx`, update the `Props` interface and add the prop to the JSX.

Replace the `Props` interface:

```typescript
interface Props {
  onAddPerson: () => void
  onAddJob: () => void
  onImport: () => void
  onForceLayout: () => void
  onGridLayout: () => void
  onListView: () => void
  viewMode: 'graph' | 'list'
  currentLayout: 'force' | 'grid'
  nodeCount: number
  edgeCount: number
  calendarSync?: React.ReactNode
}
```

Replace the destructure line:

```typescript
export function Toolbar({ onAddPerson, onAddJob, onImport, onForceLayout, onGridLayout, onListView, viewMode, currentLayout, nodeCount, edgeCount, calendarSync }: Props) {
```

Add `{calendarSync}` inside the right-side button group div (after the `List` ToolBtn and before the closing `</div>`). The right-side div currently ends with:

```typescript
        <ToolBtn onClick={onListView} icon={<List size={13} />} label="List" glow="#22c55e" active={viewMode === 'list'} />
      </div>
```

Change it to:

```typescript
        <ToolBtn onClick={onListView} icon={<List size={13} />} label="List" glow="#22c55e" active={viewMode === 'list'} />
        {calendarSync && (
          <>
            <div style={{ width: 1, height: 20, background: 'rgba(147,197,253,0.1)', margin: '0 2px' }} />
            {calendarSync}
          </>
        )}
      </div>
```

Also add the React import at the top of Toolbar.tsx (needed for `React.ReactNode`):

```typescript
import React from 'react'
import { UserPlus, Briefcase, Upload, Orbit, LayoutGrid, List } from 'lucide-react'
```

- [ ] **Step 2: Pass `<CalendarSync />` from App.tsx**

In `src/App.tsx`, add the import:

```typescript
import { CalendarSync } from './components/CalendarSync'
```

In the `<Toolbar ... />` JSX, add the `calendarSync` prop:

```typescript
      <Toolbar
        onAddPerson={() => openAdd('add-person')}
        onAddJob={() => openAdd('add-job')}
        onImport={() => setShowImport(true)}
        onForceLayout={() => { setViewMode('graph'); setCurrentLayout('force'); applyLayout('force') }}
        onGridLayout={() => { setViewMode('graph'); setCurrentLayout('grid'); applyLayout('grid') }}
        currentLayout={currentLayout}
        onListView={() => setViewMode('list')}
        viewMode={viewMode}
        nodeCount={nodes.length}
        edgeCount={edges.length}
        calendarSync={<CalendarSync />}
      />
```

- [ ] **Step 3: Verify full build passes**

```bash
cd ~/projects/network-app && npx tsc --noEmit && npm run build
```

Expected: no TypeScript errors, build succeeds.

- [ ] **Step 4: Smoke test in browser**

```bash
npm run dev
```

Open the app. Verify:
- "Connect Google" button appears in toolbar (right side, after separator)
- If `VITE_GOOGLE_CLIENT_ID` is set: clicking "Connect Google" opens Google OAuth popup
- If `VITE_GOOGLE_CLIENT_ID` is not set: button is hidden (returns null)

- [ ] **Step 5: Commit**

```bash
git add src/components/Toolbar.tsx src/App.tsx
git commit -m "feat: wire CalendarSync into toolbar — Google Calendar integration complete"
```
