# GUI Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove grid layout, redesign toolbar buttons to vertical icon+label style, and make StatsPanel collapse to icon strip at narrow viewports.

**Architecture:** Three independent changes to existing components. No new files needed. StatsPanel gains an inline `useWindowWidth` hook and a narrow-mode render path. ToolBtn gets a vertical flex layout with larger icons. Grid layout code deleted from three files.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, inline styles, Lucide icons, `@xyflow/react`

---

## Task 1: Remove Grid Layout

**Files:**
- Modify: `src/utils/layout.ts`
- Modify: `src/components/Toolbar.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Delete `computeGridLayout` from layout.ts**

Remove lines 449–502 (the entire `computeGridLayout` export). The file ends after `computeRadialLayout`.

- [ ] **Step 2: Remove grid props from Toolbar interface and component**

In `src/components/Toolbar.tsx`, remove `onGridLayout` and `currentLayout` from the `Props` interface and destructure, and remove the Grid `ToolBtn` and `LayoutGrid` import:

```tsx
import React from 'react'
import { UserPlus, Briefcase, Upload, Orbit, List } from 'lucide-react'

interface Props {
  onAddPerson: () => void
  onAddJob: () => void
  onImport: () => void
  onForceLayout: () => void
  onListView: () => void
  viewMode: 'graph' | 'list'
  nodeCount: number
  edgeCount: number
  calendarSync?: React.ReactNode
  excelSync?: React.ReactNode
}

export function Toolbar({ onAddPerson, onAddJob, onImport, onForceLayout, onListView, viewMode, nodeCount, edgeCount, calendarSync, excelSync }: Props) {
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
        <ToolBtn onClick={onAddPerson} icon={<UserPlus size={13} />} label="Add Contact" glow="#3b82f6" />
        <ToolBtn onClick={onAddJob} icon={<Briefcase size={13} />} label="Add Job" glow="#a855f7" />
        <ToolBtn onClick={onImport} icon={<Upload size={13} />} label="Import CSV" glow="#475569" />
        <div style={{ width: 1, height: 20, background: 'rgba(147,197,253,0.1)', margin: '0 2px' }} />
        <ToolBtn onClick={onForceLayout} icon={<Orbit size={13} />} label="Stellar Map" glow="#06b6d4" active={viewMode === 'graph'} />
        <ToolBtn onClick={onListView} icon={<List size={13} />} label="List" glow="#22c55e" active={viewMode === 'list'} />
        {calendarSync && (
          <>
            <div style={{ width: 1, height: 20, background: 'rgba(147,197,253,0.1)', margin: '0 2px' }} />
            {calendarSync}
          </>
        )}
        {excelSync && (
          <>
            <div style={{ width: 1, height: 20, background: 'rgba(147,197,253,0.1)', margin: '0 2px' }} />
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
```

- [ ] **Step 3: Remove grid layout state and handler from App.tsx**

In `src/App.tsx`:
- Remove `computeGridLayout` from the import: `import { computeRadialLayout } from './utils/layout'`
- Remove `currentLayout` state: `const [currentLayout, setCurrentLayout] = useState<'force' | 'grid'>('force')`
- Change the `onForceLayout` handler to just: `() => { setViewMode('graph'); applyLayout('force') }`
- Remove `currentLayout={currentLayout}` prop from `<Toolbar>`
- Remove `onGridLayout` prop from `<Toolbar>`

Updated Toolbar usage in App.tsx:
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

- [ ] **Step 4: Verify in browser**

Open `http://localhost:5173`. Toolbar should show no Grid button. Stellar Map button still works. TypeScript should compile clean (check terminal for Vite errors).

- [ ] **Step 5: Commit**

```bash
git add src/utils/layout.ts src/components/Toolbar.tsx src/App.tsx
git commit -m "feat: remove grid layout"
```

---

## Task 2: Redesign Toolbar Buttons — Vertical Icon + Label

**Files:**
- Modify: `src/components/Toolbar.tsx`
- Modify: `src/components/CalendarSync.tsx`
- Modify: `src/components/ExcelSync.tsx`

- [ ] **Step 1: Redesign `ToolBtn` in Toolbar.tsx**

Replace the `ToolBtn` function with this vertical icon+label version. Icon is ~20px, label is 10px below it, button is squarish:

```tsx
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

Also update icon sizes and labels in the Toolbar render:

```tsx
<ToolBtn onClick={onAddPerson} icon={<UserPlus size={19} />} label="Contact" glow="#3b82f6" />
<ToolBtn onClick={onAddJob} icon={<Briefcase size={19} />} label="Job" glow="#a855f7" />
<ToolBtn onClick={onImport} icon={<Upload size={19} />} label="Import" glow="#475569" />
<div style={{ width: 1, height: 32, background: 'rgba(147,197,253,0.1)', margin: '0 2px' }} />
<ToolBtn onClick={onForceLayout} icon={<Orbit size={19} />} label="Stellar" glow="#06b6d4" active={viewMode === 'graph'} />
<ToolBtn onClick={onListView} icon={<List size={19} />} label="List" glow="#22c55e" active={viewMode === 'list'} />
```

Also update the divider height in the `calendarSync` and `excelSync` sections from `height: 20` to `height: 32`.

- [ ] **Step 2: Match CalendarSync button style**

In `src/components/CalendarSync.tsx`, replace the `btn` base style and button content to use vertical layout:

```tsx
const btn: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  gap: 3,
  width: 52, padding: '6px 4px', borderRadius: 8,
  fontSize: 10, fontWeight: 500,
  cursor: 'pointer', transition: 'all 0.15s',
}
```

Update the disconnected button (show `<Calendar size={19} />` + label `"Calendar"`):
```tsx
if (!connected) {
  return (
    <button
      onClick={handleConnect}
      disabled={connecting}
      style={{ ...btn, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8' }}
    >
      <Calendar size={19} />
      <span style={{ lineHeight: 1 }}>{connecting ? 'Connecting' : 'Calendar'}</span>
    </button>
  )
}
```

Update the connected state — replace the current multi-element return with a compact version. Keep the sync result/error display as a small popout below, but make the primary button vertical:
```tsx
return (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
    <button
      onClick={handleSync}
      disabled={syncing}
      style={{ ...btn, background: '#16a34a18', border: '1px solid #16a34a44', color: '#86efac' }}
    >
      <RefreshCw size={19} className={syncing ? 'animate-spin' : ''} />
      <span style={{ lineHeight: 1 }}>{syncing ? 'Syncing' : 'Calendar'}</span>
    </button>

    {result && (
      <div style={{
        position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 20,
        background: 'rgba(2,4,9,0.95)', border: '1px solid rgba(147,197,253,0.15)',
        borderRadius: 6, padding: '4px 8px', whiteSpace: 'nowrap',
        fontSize: 11, color: 'rgba(147,197,253,0.55)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span>↑ {result.pushed} · ↓ {result.pulled}</span>
        <button onClick={() => setResult(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
          <X size={11} />
        </button>
      </div>
    )}

    {error && (
      <div style={{
        position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 20,
        background: 'rgba(2,4,9,0.95)', border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: 6, padding: '4px 8px', whiteSpace: 'nowrap',
        fontSize: 11, color: '#f87171',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span>{error}</span>
        <button onClick={handleSync} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 11, padding: 0, textDecoration: 'underline' }}>Retry</button>
        <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0, lineHeight: 1 }}><X size={11} /></button>
      </div>
    )}

    {connected && (
      <button
        onClick={handleDisconnect}
        style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: 9, padding: '1px 0', lineHeight: 1, marginTop: 1 }}
      >
        disconnect
      </button>
    )}
  </div>
)
```

- [ ] **Step 3: Match ExcelSync button style**

In `src/components/ExcelSync.tsx`, update all button styles to vertical layout:

Unlinked state:
```tsx
if (status === 'unlinked') {
  return (
    <button
      onClick={onLink}
      title="Link your Excel file for automatic sync"
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 3, width: 48, padding: '6px 4px', borderRadius: 8,
        background: 'rgba(71,85,105,0.18)', border: '1px solid rgba(71,85,105,0.44)',
        color: '#94a3b8', cursor: 'pointer', transition: 'all 0.15s',
        fontSize: 10, fontWeight: 500,
      }}
      onMouseEnter={e => { const el = e.currentTarget; el.style.background = 'rgba(71,85,105,0.3)'; el.style.color = '#f1f5f9' }}
      onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'rgba(71,85,105,0.18)'; el.style.color = '#94a3b8' }}
    >
      <Link2 size={19} />
      <span style={{ lineHeight: 1 }}>Excel</span>
    </button>
  )
}
```

Needs-permission state:
```tsx
if (status === 'needs-permission') {
  return (
    <button
      onClick={onLink}
      title="Click to reconnect Excel sync"
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 3, width: 48, padding: '6px 4px', borderRadius: 8,
        background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.4)',
        color: '#fde047', cursor: 'pointer', transition: 'all 0.15s',
        fontSize: 10, fontWeight: 500,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(234,179,8,0.22)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(234,179,8,0.12)' }}
    >
      <FileSpreadsheet size={19} />
      <span style={{ lineHeight: 1 }}>Excel</span>
    </button>
  )
}
```

Linked/syncing/error state:
```tsx
const isError = status === 'error'
const isSyncing = status === 'syncing'
const color = isError ? '#f87171' : '#86efac'
const borderColor = isError ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.25)'
const bg = isError ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.08)'

return (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 3, width: 48, padding: '6px 4px', borderRadius: 8,
      background: bg, border: `1px solid ${borderColor}`, color,
      fontSize: 10, fontWeight: 500, position: 'relative',
    }}>
      <span style={{
        position: 'absolute', top: 4, right: 4,
        width: 5, height: 5, borderRadius: '50%',
        background: isSyncing ? '#facc15' : color,
        animation: isSyncing ? 'pulse 1s infinite' : undefined,
      }} />
      <FileSpreadsheet size={19} />
      <span style={{ lineHeight: 1 }}>{isError ? 'Error' : isSyncing ? 'Syncing' : 'Excel'}</span>
    </div>
    <button
      onClick={onUnlink}
      title="Unlink Excel file"
      style={{
        background: 'none', border: 'none', color: '#334155', cursor: 'pointer',
        fontSize: 9, padding: '1px 0', lineHeight: 1,
      }}
      onMouseEnter={e => { e.currentTarget.style.color = '#f87171' }}
      onMouseLeave={e => { e.currentTarget.style.color = '#334155' }}
    >
      unlink
    </button>
  </div>
)
```

- [ ] **Step 4: Verify in browser**

Open `http://localhost:5173`. Toolbar buttons should show icons stacked above labels. Icons are visibly larger. Buttons are squarish. Hover states work. CalendarSync and ExcelSync match the style.

- [ ] **Step 5: Commit**

```bash
git add src/components/Toolbar.tsx src/components/CalendarSync.tsx src/components/ExcelSync.tsx
git commit -m "feat: redesign toolbar buttons — vertical icon+label layout"
```

---

## Task 3: Responsive StatsPanel — Collapse to Icon Strip at Narrow Width

**Files:**
- Modify: `src/components/StatsPanel.tsx`

- [ ] **Step 1: Add `useWindowWidth` hook and narrow-mode state to StatsPanel**

At the top of `src/components/StatsPanel.tsx`, add the import and hook:

```tsx
import { useMemo, useState, useEffect, useRef } from 'react'
import { BarChart2, Building2, MapPin, Heart, X } from 'lucide-react'
import type { AppNode, PersonData } from '../types'
```

Inside `StatsPanel`, add before the existing `useMemo` calls:

```tsx
const [windowWidth, setWindowWidth] = useState(window.innerWidth)
const [openSection, setOpenSection] = useState<'company' | 'location' | 'relationship' | null>(null)
const overlayRef = useRef<HTMLDivElement>(null)
const stripRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  const handler = () => setWindowWidth(window.innerWidth)
  window.addEventListener('resize', handler)
  return () => window.removeEventListener('resize', handler)
}, [])

useEffect(() => {
  if (!openSection) return
  function handleClick(e: MouseEvent) {
    if (
      overlayRef.current && !overlayRef.current.contains(e.target as Node) &&
      stripRef.current && !stripRef.current.contains(e.target as Node)
    ) {
      setOpenSection(null)
    }
  }
  document.addEventListener('mousedown', handleClick)
  return () => document.removeEventListener('mousedown', handleClick)
}, [openSection])

const isNarrow = windowWidth < 1100
```

- [ ] **Step 2: Add narrow-mode render path**

After the existing `useMemo` calls and before the `return`, add the narrow-mode JSX. Replace the entire `return (...)` with:

```tsx
if (isNarrow) {
  const iconButtons: { key: 'company' | 'location' | 'relationship'; icon: React.ReactNode; hasData: boolean }[] = [
    { key: 'company', icon: <Building2 size={16} />, hasData: companies.length > 0 },
    { key: 'relationship', icon: <Heart size={16} />, hasData: relationships.length > 0 },
    { key: 'location', icon: <MapPin size={16} />, hasData: locations.length > 0 },
  ]

  return (
    <div style={{ display: 'flex', position: 'relative', flexShrink: 0 }}>
      {/* Icon strip */}
      <div
        ref={stripRef}
        style={{
          width: 44,
          flexShrink: 0,
          background: 'rgba(2, 4, 9, 0.78)',
          borderRight: '1px solid rgba(147, 197, 253, 0.1)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 10,
          gap: 4,
        }}
      >
        {iconButtons.map(({ key, icon, hasData }) => {
          if (!hasData) return null
          const isOpen = openSection === key
          const isFiltered = activeFilter?.type === key
          return (
            <button
              key={key}
              onClick={() => setOpenSection(isOpen ? null : key)}
              title={key.charAt(0).toUpperCase() + key.slice(1)}
              style={{
                width: 32, height: 32, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isOpen ? 'rgba(59,130,246,0.15)' : 'transparent',
                border: `1px solid ${isOpen ? 'rgba(147,197,253,0.3)' : 'transparent'}`,
                color: isFiltered ? '#93c5fd' : 'rgba(147,197,253,0.45)',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              {icon}
              {isFiltered && (
                <span style={{
                  position: 'absolute', top: 3, right: 3,
                  width: 5, height: 5, borderRadius: '50%',
                  background: '#3b82f6',
                }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Floating overlay */}
      {openSection && (
        <div
          ref={overlayRef}
          style={{
            position: 'absolute', top: 0, left: 44, zIndex: 50,
            width: 220,
            background: 'rgba(2, 4, 9, 0.96)',
            border: '1px solid rgba(147, 197, 253, 0.15)',
            borderLeft: 'none',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '100%',
            overflow: 'hidden',
          }}
        >
          <div style={{
            padding: '10px 14px',
            borderBottom: '1px solid rgba(147, 197, 253, 0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ color: 'rgba(147, 197, 253, 0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>
              {openSection.toUpperCase()}
            </span>
            <button onClick={() => setOpenSection(null)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 2 }}>
              <X size={13} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {openSection === 'company' && companies.length > 0 && (
              <Section icon={<Building2 size={12} />} label="Company" items={companies} max={maxCompany} filterType="company" activeFilter={activeFilter} onToggle={toggle} />
            )}
            {openSection === 'relationship' && relationships.length > 0 && (
              <Section icon={<Heart size={12} />} label="Relationship" items={relationships} max={maxRelationship} filterType="relationship" activeFilter={activeFilter} onToggle={toggle} />
            )}
            {openSection === 'location' && locations.length > 0 && (
              <Section icon={<MapPin size={12} />} label="Location" items={locations} max={maxLocation} filterType="location" activeFilter={activeFilter} onToggle={toggle} />
            )}
          </div>
          {activeFilter?.type === openSection && (
            <button
              onClick={() => onFilter(null)}
              style={{
                margin: '8px 10px',
                padding: '6px 10px',
                background: 'rgba(147, 197, 253, 0.06)',
                border: '1px solid rgba(147, 197, 253, 0.15)',
                borderRadius: 8,
                color: 'rgba(147, 197, 253, 0.5)',
                fontSize: 11, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <X size={11} /> Clear filter
            </button>
          )}
        </div>
      )}
    </div>
  )
}

return (
  // ... existing wide-mode JSX unchanged ...
```

Keep the existing wide-mode JSX (the current full `return (...)` block) as-is below the narrow-mode early return.

- [ ] **Step 3: Verify in browser — wide mode**

Open `http://localhost:5173` at full width. StatsPanel should look and behave exactly as before.

- [ ] **Step 4: Verify in browser — narrow mode**

Resize the browser window to ~900px wide (or split-screen). The StatsPanel should collapse to a 44px icon strip. Clicking a Building2 / Heart / MapPin icon opens the overlay panel for that section. Clicking outside closes it. Active filter dot appears on the icon when a filter is set.

- [ ] **Step 5: Commit**

```bash
git add src/components/StatsPanel.tsx
git commit -m "feat: collapse StatsPanel to icon strip at narrow viewports"
```
