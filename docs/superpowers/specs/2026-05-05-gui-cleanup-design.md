# GUI Cleanup Design

**Date:** 2026-05-05

## Scope

Three changes to the network-app GUI:
1. Toolbar button redesign — icon-forward, vertical layout
2. Remove grid layout feature
3. Responsive StatsPanel — collapse to icon strip at narrow widths

---

## 1. Toolbar Button Redesign

**Goal:** More minimal, icon-forward buttons with labels beneath icons.

**Changes to `ToolBtn` in `src/components/Toolbar.tsx`:**
- Icon size: 19–20px (up from 13px, ~50% increase)
- Layout: `flex-direction: column`, icon on top, label below
- Label: 10px, single word per button
- Button shape: squarish (~48px wide), less horizontal padding (8px instead of 12px)
- Gap between icon and label: 3–4px

**Label mapping:**
| Old label | New label |
|---|---|
| Add Contact | Contact |
| Add Job | Job |
| Import CSV | Import |
| Stellar Map | Stellar |
| List | List |
| Connect Google / Sync Calendar | Calendar |
| Link Excel / Excel linked | Excel |

**Affected files:** `src/components/Toolbar.tsx`, `src/components/CalendarSync.tsx`, `src/components/ExcelSync.tsx`

---

## 2. Remove Grid Layout

**Goal:** Simplify — force layout (Stellar Map) is the only layout mode.

**Changes:**
- `src/components/Toolbar.tsx`: remove `onGridLayout` prop, `currentLayout` prop, `LayoutGrid` import, Grid `ToolBtn`
- `src/App.tsx`: remove `currentLayout` state, `applyLayout('grid')` call, `computeGridLayout` import
- `src/utils/layout.ts`: keep `computeGridLayout` export (used by nothing — delete it)
- `src/components/Toolbar.tsx`: `Toolbar` interface — remove `onGridLayout` and `currentLayout`

**No data migration needed** — layout is computed on load, not persisted.

---

## 3. Responsive StatsPanel

**Goal:** At narrow viewports (split-screen ~960px), StatsPanel stops pushing the graph off-screen.

**Breakpoint:** 1100px viewport width.

**Behavior above 1100px:** No change from today — full 220px panel always visible.

**Behavior below 1100px:**
- Panel renders as a 44px-wide icon strip (column of 3 icons: `Building2`, `Heart`, `MapPin`)
- Each icon is a button; clicking opens the full panel as a floating overlay (position absolute, left: 44px, top: 0, z-index elevated)
- Clicking same icon again, or clicking outside the overlay, closes it
- Active filter indicator: small dot on the relevant icon when a filter is active
- Overlay has same visual style as today's panel (dark glass, border)

**Implementation approach:**
- Add `useWindowWidth` hook (or inline `window.innerWidth` with resize listener) in `StatsPanel.tsx`
- Split render: narrow mode renders icon strip + conditional overlay; wide mode renders existing panel
- Overlay close: `useEffect` with `mousedown` listener on `document` (check if click is outside ref)

**Affected files:** `src/components/StatsPanel.tsx`

---

## Out of Scope

- No changes to node visuals, edges, or data model
- No changes to NodePanel or ImportModal
- No changes to force layout algorithm
