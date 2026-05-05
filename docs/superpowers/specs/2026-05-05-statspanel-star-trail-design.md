# StatsPanel Star Trail Design

**Date:** 2026-05-05

## Scope

Add a star trail effect to the 14px scrollbar corridor on the right side of the StatsPanel. The rocket scrollbar thumb travels through this corridor; the trail makes the path feel like a flight path through space.

---

## Visual Design

- **Glow trail:** A faint vertical gradient line down the center of the corridor (`rgba(147,197,253,0.08)` peak opacity), giving a soft luminous path.
- **Stars:** ~25 dots scattered along the corridor height at fixed positions.
  - Sizes: 1px, 1.5px, 2px, 2.5px (mixed)
  - Base color: `rgba(147,197,253,…)` — app blue palette, varying opacity 0.25–0.65
  - ~6 brighter stars get a soft `box-shadow: 0 0 3px rgba(147,197,253,0.5)` glow halo
- **Twinkle animation:** Each star fades opacity in/out on staggered 1.6–2.8s cycles
- **Swirl animation:** Each star drifts `translateX` ±3px on a slower 3–5s cycle, phase-offset per star, creating a gentle swirling/drifting motion
- Both animations run simultaneously on each star via CSS `animation` shorthand

---

## Implementation

### New component: `StarTrail`

A pure presentational React component — a `div` with `position: absolute`, `pointer-events: none`, covering the scrollbar corridor:

```
position: absolute
top: 0, right: 0
width: 14px (marginRight value)
height: 100%
pointer-events: none
overflow: hidden
z-index: 1
```

Contains:
- One `div` for the glow trail (vertical gradient line, centered horizontally)
- 25 `span` elements for stars, each positioned with inline `top`/`left` values

`StarTrail` is defined in `src/components/StatsPanel.tsx` (same file, below the main export).

### Animation keyframes

Added to the `SCROLL_STYLE` module-level constant:

```css
@keyframes star-twinkle {
  0%, 100% { opacity: VAR_START; }
  50% { opacity: VAR_END; }
}
@keyframes star-swirl {
  0%, 100% { transform: translateX(0px); }
  50% { transform: translateX(3px); }
}
@keyframes star-swirl-rev {
  0%, 100% { transform: translateX(0px); }
  50% { transform: translateX(-3px); }
}
```

Since CSS custom properties can't vary per-element in a keyframe, each star uses `animation` shorthand combining one of 3 twinkle variants (opacity ranges) and one of 2 swirl directions (forward/reverse), with `animation-delay` varied inline via `style` prop.

### Star data

A fixed array of 25 star descriptors defined at module level (not inside the component) to avoid recreation on render:

```ts
interface StarDef {
  top: number      // percentage 0–100
  left: number     // px 0–11 (within 14px corridor)
  size: number     // px 1 | 1.5 | 2 | 2.5
  opacity: number  // base opacity 0.25–0.65
  glow: boolean    // whether to add box-shadow
  twinkleVariant: 1 | 2 | 3   // which twinkle keyframe to use
  swirlDir: 'fwd' | 'rev'     // which swirl direction
  twinkleDuration: number      // ms 1600–2800
  swirlDuration: number        // ms 3000–5000
  delay: number               // ms 0–1400
}
```

Values are hardcoded (no Math.random at render time).

### Placement in StatsPanel

`StarTrail` is rendered inside the outer panel div, positioned absolute so it overlays the scrollbar corridor. The outer div already has `position: relative` implied by being a flex container — add `position: 'relative'` explicitly to the outer div style to anchor the absolute child.

---

## Out of Scope

- Stars do not move with the scroll position (they're fixed in the corridor)
- No changes to the rocket thumb SVG
- No changes to narrow-mode (icon strip) layout
- Firefox: no custom scrollbar, no star trail visible (acceptable for personal app)
