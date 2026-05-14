# High-Impact UX Features — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add name search (toolbar), click-to-contact link (NodePanel), and "Contacted Today" quick action (NodePanel) to the network-app.

**Architecture:** All changes confined to React components and one new pure utility. No Zustand store schema changes. No new npm dependencies. Search state lives in `App.tsx` alongside `activeFilter`. Contact link and contacted-today both live in `NodePanel.tsx`.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Zustand, lucide-react

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/utils/contactHelpers.ts` | Create | `buildContactUrl` — pure URL builder for all contact methods |
| `src/utils/contactHelpers.test.ts` | Create | Vitest unit tests for `buildContactUrl` |
| `src/components/Toolbar.tsx` | Modify | Add `searchQuery` + `onSearchChange` props; render search input |
| `src/App.tsx` | Modify | Add `searchQuery` state; extend `displayNodes`; wire Toolbar + ListView |
| `src/components/ListView.tsx` | Modify | Accept `searchQuery` prop; filter rows by name |
| `src/components/NodePanel.tsx` | Modify | Add contact link row + contacted-today inline form |

---

### Task 1: buildContactUrl utility + tests

**Files:**
- Create: `src/utils/contactHelpers.ts`
- Create: `src/utils/contactHelpers.test.ts`

- [ ] **Step 1.1: Write the failing test**

Create `src/utils/contactHelpers.test.ts`:

```typescript
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
```

- [ ] **Step 1.2: Run test — expect failure**

```
cd ~/projects/network-app && npm test -- contactHelpers
```

Expected: FAIL — `Cannot find module './contactHelpers'`

- [ ] **Step 1.3: Implement the utility**

Create `src/utils/contactHelpers.ts`:

```typescript
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
```

- [ ] **Step 1.4: Run test — expect pass**

```
npm test -- contactHelpers
```

Expected: PASS — 7 tests

- [ ] **Step 1.5: Commit**

```bash
git add src/utils/contactHelpers.ts src/utils/contactHelpers.test.ts
git commit -m "feat: add buildContactUrl utility with tests"
```

---

### Task 2: Toolbar search UI

**Files:**
- Modify: `src/components/Toolbar.tsx`

- [ ] **Step 2.1: Replace Toolbar.tsx**

Full replacement of `src/components/Toolbar.tsx`:

```tsx
import React from 'react'
import { UserPlus, Briefcase, Upload, Orbit, List, Search, X } from 'lucide-react'

interface Props {
  onAddPerson: () => void
  onAddJob: () => void
  onImport: () => void
  onForceLayout: () => void
  onListView: () => void
  viewMode: 'graph' | 'list'
  nodeCount: number
  edgeCount: number
  searchQuery: string
  onSearchChange: (q: string) => void
  calendarSync?: React.ReactNode
  excelSync?: React.ReactNode
}

export function Toolbar({ onAddPerson, onAddJob, onImport, onForceLayout, onListView, viewMode, nodeCount, edgeCount, searchQuery, onSearchChange, calendarSync, excelSync }: Props) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '8px 16px',
      background: 'rgba(2, 4, 9, 0.82)',
      borderBottom: '1px solid rgba(147, 197, 253, 0.1)',
      backdropFilter: 'blur(12px)',
      flexShrink: 0, zIndex: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
        <span style={{ fontSize: 16 }}>✦</span>
        <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14, letterSpacing: '0.04em' }}>
          Constellation
        </span>
        <span style={{ color: 'rgba(147, 197, 253, 0.35)', fontSize: 12, marginLeft: 4 }}>
          {nodeCount} stars · {edgeCount} links
        </span>
      </div>

      {/* Search input */}
      <div style={{ position: 'relative' }}>
        <Search size={13} style={{
          position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
          color: 'rgba(147, 197, 253, 0.35)', pointerEvents: 'none',
        }} />
        <input
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search contacts…"
          style={{
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(147, 197, 253, 0.15)',
            borderRadius: 8,
            color: '#e2e8f0',
            fontSize: 12,
            padding: '5px 26px 5px 26px',
            width: 180,
            outline: 'none',
          }}
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            style={{
              position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
              padding: 2, display: 'flex', alignItems: 'center',
            }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
        <ToolBtn onClick={onAddPerson} icon={<UserPlus size={19} />} label="Contact" glow="#3b82f6" />
        <ToolBtn onClick={onAddJob} icon={
          <span style={{ position: 'relative', display: 'inline-flex' }}>
            <Briefcase size={19} />
            <span style={{ position: 'absolute', top: -6, right: -5, fontSize: 11, fontWeight: 700, lineHeight: 1 }}>+</span>
          </span>
        } label="Job" glow="#a855f7" />
        <ToolBtn onClick={onImport} icon={<Upload size={19} />} label="Import" glow="#475569" />
        <div style={{ width: 1, height: 32, background: 'rgba(147,197,253,0.1)', margin: '0 2px' }} />
        <ToolBtn onClick={onForceLayout} icon={<Orbit size={19} />} label="Stellar" glow="#06b6d4" active={viewMode === 'graph'} />
        <ToolBtn onClick={onListView} icon={<List size={19} />} label="List" glow="#22c55e" active={viewMode === 'list'} />
        {calendarSync && (
          <>
            <div style={{ width: 1, height: 32, background: 'rgba(147,197,253,0.1)', margin: '0 2px' }} />
            {calendarSync}
          </>
        )}
        {excelSync && (
          <>
            <div style={{ width: 1, height: 32, background: 'rgba(147,197,253,0.1)', margin: '0 2px' }} />
            {excelSync}
          </>
        )}
      </div>

      <span style={{ color: 'rgba(147, 197, 253, 0.18)', fontSize: 11, marginLeft: 8 }} className="hidden lg:block">
        Drag handles to connect · Delete to remove
      </span>
    </div>
  )
}

function ToolBtn({ onClick, icon, label, glow, active }: {
  onClick: () => void
  icon: React.ReactNode
  label: string
  glow: string
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 3,
        width: 48, padding: '6px 4px', borderRadius: 8,
        background: active ? `${glow}30` : `${glow}18`,
        border: `1px solid ${active ? glow + '88' : glow + '44'}`,
        color: active ? '#f1f5f9' : '#94a3b8',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.background = `${glow}30`
        el.style.borderColor = `${glow}88`
        el.style.color = '#f1f5f9'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.background = active ? `${glow}30` : `${glow}18`
        el.style.borderColor = active ? `${glow}88` : `${glow}44`
        el.style.color = active ? '#f1f5f9' : '#94a3b8'
      }}
    >
      {icon}
      <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.02em', lineHeight: 1 }}>{label}</span>
    </button>
  )
}
```

- [ ] **Step 2.2: Check TypeScript (errors expected)**

```
cd ~/projects/network-app && npx tsc --noEmit
```

Expected: errors about `searchQuery`/`onSearchChange` not passed from `App.tsx` — this is fine, fixed in Task 3.

- [ ] **Step 2.3: Commit**

```bash
git add src/components/Toolbar.tsx
git commit -m "feat: add search input to toolbar"
```

---

### Task 3: Search state in App.tsx + graph dim

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 3.1: Add searchQuery state**

In `src/App.tsx`, find the state block (around line 67):

```tsx
  const [panelMode, setPanelMode] = useState<PanelMode | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | null>(null)
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph')
```

Replace with:

```tsx
  const [panelMode, setPanelMode] = useState<PanelMode | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph')
```

- [ ] **Step 3.2: Replace displayNodes memo**

Find the `displayNodes` useMemo (around line 150) and replace it entirely:

```tsx
  const displayNodes = useMemo(() => {
    const lq = searchQuery.toLowerCase()
    return nodes.map((n) => {
      const d = n.data as unknown as PersonData
      const edgeCount = edgeCounts.get(n.id) ?? 0

      let dimmed = false
      if (n.type === 'person') {
        if (activeFilter) {
          const val = (d[activeFilter.type as keyof PersonData] ?? '').toString().trim()
          if (val !== activeFilter.value) dimmed = true
        }
        if (lq && !d.name.toLowerCase().includes(lq)) dimmed = true
      } else if (activeFilter) {
        dimmed = true
      }

      return {
        ...n,
        data: { ...n.data, edgeCount },
        ...(dimmed ? { style: { ...n.style, opacity: 0.15, transition: 'opacity 0.2s' } } : {}),
      }
    })
  }, [nodes, edges, activeFilter, searchQuery, edgeCounts])
```

- [ ] **Step 3.3: Pass searchQuery to Toolbar**

Find the `<Toolbar` JSX and add two new props:

```tsx
      <Toolbar
        onAddPerson={() => openAdd('add-person')}
        onAddJob={() => openAdd('add-job')}
        onImport={() => setShowImport(true)}
        onForceLayout={() => { setViewMode('graph'); applyLayout('force') }}
        onListView={() => setViewMode('list')}
        viewMode={viewMode}
        nodeCount={nodes.length}
        edgeCount={edges.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        calendarSync={<CalendarSync />}
        excelSync={excelSyncSupported() ? (
          <ExcelSync
            status={excelStatus}
            fileName={excelFileName}
            onLink={handleLinkExcel}
            onUnlink={handleUnlinkExcel}
          />
        ) : undefined}
      />
```

- [ ] **Step 3.4: Pass searchQuery to ListView**

Find the `<ListView` JSX and add `searchQuery`:

```tsx
            <ListView
              onSelectNode={(id) => { setSelectedNode(id); setPanelMode('edit') }}
              searchQuery={searchQuery}
            />
```

- [ ] **Step 3.5: Check TypeScript (one error expected)**

```
npx tsc --noEmit
```

Expected: one error — `ListView` doesn't accept `searchQuery` yet. Fixed in Task 4. All other errors resolved.

- [ ] **Step 3.6: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add search state, graph dim logic, wire Toolbar and ListView"
```

---

### Task 4: ListView search filter

**Files:**
- Modify: `src/components/ListView.tsx`

- [ ] **Step 4.1: Add searchQuery prop and filter**

In `src/components/ListView.tsx`, find the `Props` interface and the top of `ListView`:

```tsx
interface Props {
  onSelectNode: (id: string) => void
}

export function ListView({ onSelectNode }: Props) {
  const { nodes, edges } = useNetworkStore()

  const rows = useMemo(() => {
    const people = nodes.filter(n => n.type === 'person')
    const sorted = [...people].sort((a, b) => {
```

Replace with:

```tsx
interface Props {
  onSelectNode: (id: string) => void
  searchQuery?: string
}

export function ListView({ onSelectNode, searchQuery }: Props) {
  const { nodes, edges } = useNetworkStore()

  const rows = useMemo(() => {
    const lq = (searchQuery ?? '').toLowerCase()
    const people = nodes.filter(n => n.type === 'person')
    const filtered = lq
      ? people.filter(n => (n.data as unknown as PersonData).name.toLowerCase().includes(lq))
      : people
    const sorted = [...filtered].sort((a, b) => {
```

The rest of the memo body is unchanged — it still references `sorted` for mapping.

- [ ] **Step 4.2: Check TypeScript**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4.3: Manual verification**

Open http://localhost:5173/. Type a name fragment in the toolbar search box:
- Graph view: non-matching stars dim to 15% opacity
- Switch to list view: only matching rows shown
- Clear with × button: all nodes/rows return to full opacity

- [ ] **Step 4.4: Commit**

```bash
git add src/components/ListView.tsx
git commit -m "feat: filter list view rows by search query"
```

---

### Task 5: Contact link in NodePanel

**Files:**
- Modify: `src/components/NodePanel.tsx`

- [ ] **Step 5.1: Add new imports**

In `src/components/NodePanel.tsx`, find:

```tsx
import { X, Trash2, CheckCircle2, Circle } from 'lucide-react'
```

Replace with:

```tsx
import { X, Trash2, CheckCircle2, Circle, Mail, Phone, ExternalLink } from 'lucide-react'
import { buildContactUrl } from '../utils/contactHelpers'
```

`ContactMethod` is already imported from `'../types'` — no change needed there.

- [ ] **Step 5.2: Add ContactLink component**

Add these two functions at the bottom of `src/components/NodePanel.tsx`, after the existing `Field` component:

```tsx
function contactIcon(method: ContactMethod) {
  if (method === 'email') return <Mail size={13} />
  if (method === 'phone') return <Phone size={13} />
  return <ExternalLink size={13} />
}

function ContactLink({ method, value }: { method: ContactMethod; value: string }) {
  if (!value.trim()) return null
  const url = buildContactUrl(method, value)
  if (!url) return null
  return (
    <button
      onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
      title={value}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 12px',
        background: 'rgba(59, 130, 246, 0.08)',
        border: '1px solid rgba(147, 197, 253, 0.2)',
        borderRadius: 20,
        color: '#93c5fd',
        fontSize: 12,
        cursor: 'pointer',
        maxWidth: '100%',
        overflow: 'hidden',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.16)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.08)')}
    >
      {contactIcon(method)}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value}
      </span>
    </button>
  )
}
```

- [ ] **Step 5.3: Render ContactLink after Name field**

In `NodePanel` JSX, find the Name field (inside the `isPerson` branch):

```tsx
            <Field label="Name *">
              <input value={personForm.name} onChange={(e) => setPersonForm({ ...personForm, name: e.target.value })}
                style={inputStyle} placeholder="Jane Smith" />
            </Field>
```

Add `ContactLink` directly after it:

```tsx
            <Field label="Name *">
              <input value={personForm.name} onChange={(e) => setPersonForm({ ...personForm, name: e.target.value })}
                style={inputStyle} placeholder="Jane Smith" />
            </Field>
            {mode === 'edit' && personForm.contactValue && (
              <ContactLink method={personForm.contactMethod} value={personForm.contactValue} />
            )}
```

- [ ] **Step 5.4: Check TypeScript**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5.5: Manual verification**

Click a contact node that has a `contactValue` set. NodePanel opens. Below the Name field, a pill button appears with an icon and the contact value. Click it — opens URL or mailto in a new tab/window.

- [ ] **Step 5.6: Commit**

```bash
git add src/components/NodePanel.tsx
git commit -m "feat: add click-to-contact link in NodePanel"
```

---

### Task 6: Contacted Today in NodePanel

**Files:**
- Modify: `src/components/NodePanel.tsx`

- [ ] **Step 6.1: Add contacted-today state**

In `NodePanel`, find the existing state declarations:

```tsx
  const [personForm, setPersonForm] = useState<Omit<PersonData, 'nodeType'>>(emptyPerson())
  const [jobForm, setJobForm] = useState<Omit<JobData, 'nodeType'>>(emptyJob)
```

Add two new state variables after them:

```tsx
  const [personForm, setPersonForm] = useState<Omit<PersonData, 'nodeType'>>(emptyPerson())
  const [jobForm, setJobForm] = useState<Omit<JobData, 'nodeType'>>(emptyJob)
  const [showContactedToday, setShowContactedToday] = useState(false)
  const [todayNote, setTodayNote] = useState('')
```

- [ ] **Step 6.2: Add handleContactedToday function**

In `NodePanel`, add this function after `handleDelete`:

```tsx
  function handleContactedToday() {
    if (!nodeId || existingNode?.type !== 'person') return
    const today = getToday()
    const prevData = existingNode.data as PersonData
    const newFollowUp = computeNextFollowUp(
      prevData.connectedDate, today,
      prevData.followUpMode || 'auto', prevData.customIntervalDays ?? 30,
    )
    updateNode(nodeId, {
      lastContact: today,
      interactionCount: (prevData.interactionCount ?? 0) + 1,
      nextFollowUp: newFollowUp,
      ...(todayNote.trim() ? { reminderNote: todayNote.trim() } : {}),
    })
    onClose()
  }
```

- [ ] **Step 6.3: Add Contacted Today UI to footer**

Find the panel footer:

```tsx
      <div className="p-4" style={{ borderTop: '1px solid rgba(147, 197, 253, 0.1)' }}>
        <button onClick={handleSubmit}
          disabled={isPerson ? !personForm.name : !jobForm.title}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium py-2 rounded-lg transition-colors">
          {mode === 'edit' ? 'Save Changes' : 'Add'}
        </button>
      </div>
```

Replace with:

```tsx
      <div className="p-4 flex flex-col gap-2" style={{ borderTop: '1px solid rgba(147, 197, 253, 0.1)' }}>
        {mode === 'edit' && isPerson && (
          showContactedToday ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <textarea
                value={todayNote}
                onChange={e => setTodayNote(e.target.value)}
                placeholder="What happened? (optional)"
                rows={3}
                style={{ ...inputStyle, resize: 'none' }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={handleContactedToday}
                  style={{
                    flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    background: '#065f46', border: '1px solid #059669', color: '#6ee7b7', cursor: 'pointer',
                  }}
                >
                  Confirm ✦
                </button>
                <button
                  onClick={() => { setShowContactedToday(false); setTodayNote('') }}
                  style={{
                    flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 13,
                    background: 'transparent', border: '1px solid #334155', color: '#64748b', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowContactedToday(true)}
              style={{
                width: '100%', padding: '7px 0', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: 'rgba(6, 95, 70, 0.3)', border: '1px solid rgba(5, 150, 105, 0.4)',
                color: '#6ee7b7', cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(6,95,70,0.5)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(6,95,70,0.3)')}
            >
              Contacted Today ✦
            </button>
          )
        )}
        <button onClick={handleSubmit}
          disabled={isPerson ? !personForm.name : !jobForm.title}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium py-2 rounded-lg transition-colors">
          {mode === 'edit' ? 'Save Changes' : 'Add'}
        </button>
      </div>
```

- [ ] **Step 6.4: Check TypeScript**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6.5: Manual verification**

Open a contact's edit panel. "Contacted Today ✦" button appears above Save Changes. Click it — expands into textarea + Confirm/Cancel. Optionally type a note. Click Confirm — panel closes. Switch to list view and confirm that contact's Last Contact column shows today's date.

- [ ] **Step 6.6: Commit**

```bash
git add src/components/NodePanel.tsx
git commit -m "feat: add contacted-today quick action to NodePanel"
```

---

## Final check

```
npm test
```

Expected: all pre-existing tests pass + 7 new `contactHelpers` tests pass.
