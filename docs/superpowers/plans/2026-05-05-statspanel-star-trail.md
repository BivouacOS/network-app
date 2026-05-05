# StatsPanel Star Trail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a star trail with glow path and swirling/twinkling stars to the 14px scrollbar corridor on the right side of the StatsPanel.

**Architecture:** Single-file change to `src/components/StatsPanel.tsx`. Keyframe animations added to the existing `SCROLL_STYLE` constant. A module-level `STARS` data array and `StarTrail` component added at the bottom of the file. `StarTrail` rendered inside the wide-mode panel div as an absolutely-positioned overlay with `pointer-events: none`.

**Tech Stack:** React 18, TypeScript, CSS keyframe animations, inline styles

---

## Task 1: Add Star Trail to StatsPanel

**Files:**
- Modify: `src/components/StatsPanel.tsx`

- [ ] **Step 1: Extend `SCROLL_STYLE` with keyframe animations**

Replace the existing `SCROLL_STYLE` constant (currently lines 17–35) with this version that appends the new keyframes:

```ts
const SCROLL_STYLE = `
  .statspanel-scroll::-webkit-scrollbar {
    width: 10px;
  }
  .statspanel-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .statspanel-scroll::-webkit-scrollbar-thumb {
    background-color: transparent;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='28' viewBox='0 0 10 28'%3E%3Cpath d='M5 1 C5 1 9 8 9 15 C9 19.5 7.2 22 5 22 C2.8 22 1 19.5 1 15 C1 8 5 1 5 1Z' fill='rgba(147%2C197%2C253%2C0.6)' stroke='rgba(147%2C197%2C253%2C0.8)' stroke-width='0.5'/%3E%3Ccircle cx='5' cy='14' r='1.5' fill='rgba(96%2C165%2C250%2C0.7)'/%3E%3Cpath d='M1.5 17 L0 22 L3 20Z' fill='rgba(147%2C197%2C253%2C0.35)'/%3E%3Cpath d='M8.5 17 L10 22 L7 20Z' fill='rgba(147%2C197%2C253%2C0.35)'/%3E%3Cpath d='M3.5 22 L2.5 27 L5 25 L7.5 27 L6.5 22Z' fill='rgba(251%2C191%2C36%2C0.6)'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-size: 10px 28px;
    background-position: center top;
    border-radius: 5px;
  }
  @keyframes star-twinkle-a {
    0%, 100% { opacity: 0.2; }
    50% { opacity: 0.65; }
  }
  @keyframes star-twinkle-b {
    0%, 100% { opacity: 0.45; }
    50% { opacity: 0.1; }
  }
  @keyframes star-twinkle-c {
    0%, 100% { opacity: 0.55; }
    50% { opacity: 0.15; }
  }
  @keyframes star-swirl {
    0%, 100% { transform: translateX(0px); }
    50% { transform: translateX(3px); }
  }
  @keyframes star-swirl-rev {
    0%, 100% { transform: translateX(0px); }
    50% { transform: translateX(-3px); }
  }
`
```

- [ ] **Step 2: Add `StarDef` interface and `STARS` array after `SCROLL_STYLE`**

Add this block immediately after the `SCROLL_STYLE` constant (before the `tally` function):

```ts
interface StarDef {
  top: number
  left: number
  size: number
  opacity: number
  glow: boolean
  twinkleVariant: 'a' | 'b' | 'c'
  swirlDir: 'fwd' | 'rev'
  twinkleDuration: number
  swirlDuration: number
  delay: number
}

const STARS: StarDef[] = [
  { top: 3,  left: 3,  size: 2,   opacity: 0.55, glow: true,  twinkleVariant: 'a', swirlDir: 'fwd', twinkleDuration: 2100, swirlDuration: 3800, delay: 0    },
  { top: 7,  left: 9,  size: 1,   opacity: 0.3,  glow: false, twinkleVariant: 'b', swirlDir: 'rev', twinkleDuration: 1700, swirlDuration: 4200, delay: 200  },
  { top: 12, left: 5,  size: 1.5, opacity: 0.45, glow: false, twinkleVariant: 'c', swirlDir: 'fwd', twinkleDuration: 2400, swirlDuration: 3400, delay: 500  },
  { top: 17, left: 2,  size: 2.5, opacity: 0.6,  glow: true,  twinkleVariant: 'a', swirlDir: 'rev', twinkleDuration: 1900, swirlDuration: 4800, delay: 100  },
  { top: 22, left: 10, size: 1,   opacity: 0.25, glow: false, twinkleVariant: 'b', swirlDir: 'fwd', twinkleDuration: 2200, swirlDuration: 3200, delay: 800  },
  { top: 27, left: 6,  size: 2,   opacity: 0.5,  glow: true,  twinkleVariant: 'c', swirlDir: 'rev', twinkleDuration: 1600, swirlDuration: 4600, delay: 300  },
  { top: 32, left: 2,  size: 1.5, opacity: 0.35, glow: false, twinkleVariant: 'a', swirlDir: 'fwd', twinkleDuration: 2700, swirlDuration: 3600, delay: 700  },
  { top: 37, left: 8,  size: 1,   opacity: 0.4,  glow: false, twinkleVariant: 'b', swirlDir: 'rev', twinkleDuration: 2000, swirlDuration: 5000, delay: 400  },
  { top: 42, left: 4,  size: 2.5, opacity: 0.6,  glow: true,  twinkleVariant: 'c', swirlDir: 'fwd', twinkleDuration: 1800, swirlDuration: 3900, delay: 1100 },
  { top: 47, left: 11, size: 1,   opacity: 0.28, glow: false, twinkleVariant: 'a', swirlDir: 'rev', twinkleDuration: 2600, swirlDuration: 4300, delay: 0    },
  { top: 52, left: 3,  size: 2,   opacity: 0.5,  glow: false, twinkleVariant: 'b', swirlDir: 'fwd', twinkleDuration: 1700, swirlDuration: 3700, delay: 600  },
  { top: 57, left: 7,  size: 1.5, opacity: 0.42, glow: true,  twinkleVariant: 'c', swirlDir: 'rev', twinkleDuration: 2300, swirlDuration: 4500, delay: 900  },
  { top: 62, left: 1,  size: 1,   opacity: 0.3,  glow: false, twinkleVariant: 'a', swirlDir: 'fwd', twinkleDuration: 2800, swirlDuration: 3100, delay: 1300 },
  { top: 66, left: 9,  size: 2,   opacity: 0.55, glow: true,  twinkleVariant: 'b', swirlDir: 'rev', twinkleDuration: 1900, swirlDuration: 4000, delay: 200  },
  { top: 71, left: 4,  size: 1,   opacity: 0.25, glow: false, twinkleVariant: 'c', swirlDir: 'fwd', twinkleDuration: 2100, swirlDuration: 4700, delay: 500  },
  { top: 75, left: 2,  size: 2.5, opacity: 0.58, glow: true,  twinkleVariant: 'a', swirlDir: 'rev', twinkleDuration: 1600, swirlDuration: 3500, delay: 800  },
  { top: 79, left: 8,  size: 1.5, opacity: 0.38, glow: false, twinkleVariant: 'b', swirlDir: 'fwd', twinkleDuration: 2500, swirlDuration: 4100, delay: 0    },
  { top: 83, left: 5,  size: 1,   opacity: 0.32, glow: false, twinkleVariant: 'c', swirlDir: 'rev', twinkleDuration: 2000, swirlDuration: 3300, delay: 1100 },
  { top: 86, left: 10, size: 2,   opacity: 0.52, glow: true,  twinkleVariant: 'a', swirlDir: 'fwd', twinkleDuration: 1800, swirlDuration: 4900, delay: 400  },
  { top: 89, left: 3,  size: 1,   opacity: 0.27, glow: false, twinkleVariant: 'b', swirlDir: 'rev', twinkleDuration: 2700, swirlDuration: 3800, delay: 700  },
  { top: 92, left: 7,  size: 2.5, opacity: 0.62, glow: true,  twinkleVariant: 'c', swirlDir: 'fwd', twinkleDuration: 1700, swirlDuration: 4400, delay: 300  },
  { top: 94, left: 1,  size: 1.5, opacity: 0.35, glow: false, twinkleVariant: 'a', swirlDir: 'rev', twinkleDuration: 2200, swirlDuration: 3600, delay: 1000 },
  { top: 96, left: 9,  size: 1,   opacity: 0.3,  glow: false, twinkleVariant: 'b', swirlDir: 'fwd', twinkleDuration: 2400, swirlDuration: 4200, delay: 600  },
  { top: 97, left: 5,  size: 2,   opacity: 0.48, glow: true,  twinkleVariant: 'c', swirlDir: 'rev', twinkleDuration: 1900, swirlDuration: 5000, delay: 200  },
  { top: 99, left: 3,  size: 1,   opacity: 0.22, glow: false, twinkleVariant: 'a', swirlDir: 'fwd', twinkleDuration: 2600, swirlDuration: 3900, delay: 900  },
]
```

- [ ] **Step 3: Add `StarTrail` component at bottom of file**

Add this after the `Section` component (at the very end of the file):

```tsx
function StarTrail() {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      width: 14,
      height: '100%',
      pointerEvents: 'none',
      overflow: 'hidden',
      zIndex: 1,
    }}>
      {/* Glow trail — faint vertical gradient line centered in corridor */}
      <div style={{
        position: 'absolute',
        left: 6,
        top: 0,
        width: 2,
        height: '100%',
        background: 'linear-gradient(to bottom, transparent, rgba(147,197,253,0.06) 15%, rgba(147,197,253,0.1) 50%, rgba(147,197,253,0.06) 85%, transparent)',
        borderRadius: 1,
      }} />

      {/* Stars */}
      {STARS.map((s, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: `${s.top}%`,
            left: s.left,
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            background: `rgba(147,197,253,${s.opacity})`,
            boxShadow: s.glow ? '0 0 3px rgba(147,197,253,0.5)' : undefined,
            animation: [
              `star-twinkle-${s.twinkleVariant} ${s.twinkleDuration}ms ease-in-out ${s.delay}ms infinite`,
              `${s.swirlDir === 'fwd' ? 'star-swirl' : 'star-swirl-rev'} ${s.swirlDuration}ms ease-in-out ${s.delay}ms infinite`,
            ].join(', '),
          }}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Update the wide-mode outer div to enable absolute positioning and render `StarTrail`**

In the wide-mode `return (...)`, the outer div currently has:
```tsx
<div style={{
  width: 232,
  flexShrink: 0,
  background: 'rgba(2, 4, 9, 0.78)',
  borderRight: '1px solid rgba(147, 197, 253, 0.15)',
  borderLeft: '1px solid rgba(147, 197, 253, 0.15)',
  backdropFilter: 'blur(12px)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}}>
  <style>{SCROLL_STYLE}</style>
```

Add `position: 'relative'` to the style and render `<StarTrail />` immediately after the `<style>` tag:

```tsx
<div style={{
  width: 232,
  flexShrink: 0,
  position: 'relative',
  background: 'rgba(2, 4, 9, 0.78)',
  borderRight: '1px solid rgba(147, 197, 253, 0.15)',
  borderLeft: '1px solid rgba(147, 197, 253, 0.15)',
  backdropFilter: 'blur(12px)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}}>
  <style>{SCROLL_STYLE}</style>
  <StarTrail />
```

- [ ] **Step 5: TypeScript check**

Run: `cd C:\Users\nolan\projects\network-app && npx tsc --noEmit 2>&1`

Expected: no errors. Fix any that appear.

- [ ] **Step 6: Verify in browser**

Open `http://localhost:5173`. Check:
- The 14px corridor to the right of the stats content shows small blue stars
- Stars twinkle and drift slightly side to side
- A faint vertical glow line runs down the center of the corridor
- The rocket scrollbar still appears and travels through the star field when scrolling
- `pointer-events: none` — hovering/clicking the corridor does not interfere with scrolling

- [ ] **Step 7: Commit**

```bash
cd C:\Users\nolan\projects\network-app
git add src/components/StatsPanel.tsx
git commit -m "feat: add swirling star trail to StatsPanel scrollbar corridor"
```
