# High-Impact UX Features — Design Spec

**Date:** 2026-05-14
**Scope:** Search, click-to-contact, contacted-today quick action

---

## 1. Search

### What
Global contact search filtering both graph and list views simultaneously.

### State
- `searchQuery: string` added to `App.tsx` alongside `activeFilter`
- Cleared independently of `activeFilter`; both can be active at once

### Toolbar
- Text input added between node count and action buttons
- Placeholder: "Search contacts…"
- × clear button appears when query is non-empty

### Graph view
- `displayNodes` memo extended: person nodes whose name does not match `searchQuery` get `opacity: 0.15`
- Same dim mechanic already used by `activeFilter`
- Empty query = no dimming
- Search and filter compose: a node must satisfy both to be fully opaque

### List view
- `ListView` receives `searchQuery` prop
- Filters `rows` before render — case-insensitive substring match on `d.name`

### Scope
- Name-only match (no company, location, etc.)
- No fuzzy matching — substring is sufficient for 94 contacts

---

## 2. Click-to-Contact

### What
Render `contactValue` as a clickable link in NodePanel, below the name, in edit mode.

### Placement
- Rendered as a pill button row directly below the name field
- Only shown when `contactValue` is non-empty
- Not a form field — read-only action row

### Link behavior by `contactMethod`

| Method | Behavior |
|--------|----------|
| `email` | `mailto:${contactValue}` |
| `phone` | `tel:${contactValue}` |
| `linkedin` | Open `contactValue` as URL in new tab; prepend `https://` if no protocol present |
| `other` | Attempt open as URL in new tab |

### Style
- Pill button with icon (matching contact method) + truncated `contactValue` label
- Opens via `window.open(url, '_blank', 'noopener,noreferrer')`
- No store changes — purely read action

---

## 3. Contacted Today

### What
One-click "log a contact" action in NodePanel edit mode that sets today as last contact, increments interaction count, and optionally captures a note.

### Placement
- Button labeled "Contacted Today ✦" between form fields and Save Changes button
- Edit mode only (not shown in add-person mode)

### Interaction flow
1. User clicks button
2. Button replaced by inline mini-form:
   - Textarea (3 rows, placeholder: "What happened? (optional)")
   - "Confirm" button + "Cancel" button
3. **Confirm:** apply changes + close panel
4. **Cancel:** collapse back to button, no changes

### Changes on confirm
- `lastContact` = today (YYYY-MM-DD)
- `interactionCount` = prev + 1
- `reminderNote` = note if non-empty, else keep existing value
- `nextFollowUp` recomputed via `computeNextFollowUp` using updated `lastContact`
- Calls `updateNode` then `onClose`

### No separate history log
Interaction count ticks up; note replaces reminderNote. Full interaction log is out of scope.

---

## Files Affected

| File | Change |
|------|--------|
| `src/App.tsx` | Add `searchQuery` state; pass to Toolbar + ListView; extend `displayNodes` memo |
| `src/components/Toolbar.tsx` | Add search input + clear button |
| `src/components/ListView.tsx` | Accept + apply `searchQuery` filter |
| `src/components/NodePanel.tsx` | Add contact link row; add contacted-today flow |
