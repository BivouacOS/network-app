# StatsPanel Visual Update Design

**Date:** 2026-05-05

## Scope

Two visual changes to `src/components/StatsPanel.tsx`:
1. Semi-transparent border framing the panel
2. Minimalist rocket ship scrollbar thumb on the inner scroll container

---

## 1. Border

**Goal:** Frame the StatsPanel as a distinct glass card rather than a flush edge.

**Change:**
- Add `borderLeft: '1px solid rgba(147, 197, 253, 0.15)'` to the outer panel div (currently has no left border)
- Update `borderRight` from `rgba(147, 197, 253, 0.1)` to `rgba(147, 197, 253, 0.15)` to match

Both borders match the existing app palette (blue-white at low opacity).

---

## 2. Rocket Scrollbar

**Goal:** Replace the default browser scrollbar on the inner scroll container with a minimalist rocket ship thumb.

**Scrollbar specs:**
- Width: 10px
- Track: transparent
- Thumb: SVG rocket as `background-image` data URI
  - `background-size: 10px 28px`
  - `background-repeat: no-repeat`
  - `background-position: center top` (nose at top of thumb, scrolling toward top)
  - Background color: transparent
  - Border-radius: 5px

**Rocket SVG design:**
- Nose up (points toward top of panel)
- Body: `rgba(147, 197, 253, 0.6)` fill, `rgba(147, 197, 253, 0.8)` stroke — blue, consistent with app palette
- Porthole: `rgba(96, 165, 250, 0.7)` — slightly brighter blue
- Fins: `rgba(147, 197, 253, 0.3)` — subtle
- Flame: `rgba(251, 191, 36, 0.6)` fill — amber, trails below body

**Implementation:**
- Inject a `<style>` tag in the StatsPanel component using a unique scoped class `.stat-scroll`
- Apply `.stat-scroll` className to the inner scroll div (currently `style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}`)
- Webkit-only (`-webkit-scrollbar` pseudo-elements) — Firefox falls back to native scrollbar; acceptable for personal app

---

## Out of Scope

- No changes to Section components, filter logic, or narrow-mode behavior
- No changes to wide-mode layout beyond the border and scrollbar
