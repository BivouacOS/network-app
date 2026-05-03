# Crossing-Minimization Layout Design

**Date:** 2026-05-03
**Scope:** `src/utils/layout.ts` — constellation (force) layout only

## Problem

The current `computeForceLayout` uses a random-seeded spring simulation. Each run produces a different result, some with more edge crossings than others. Crossings make the graph harder to read. Minimizing them is a preference, not a hard requirement.

## Approach: Multi-run best-of + local swap

Two-phase enhancement, entirely within `computeForceLayout`. No changes to callers, types, or other files.

### Phase 1 — Multi-run, keep best (A)

Run `simulate()` 6 times per component with different random seeds. After each run, call `countCrossings()` to score the result. Keep the positions with the lowest crossing count.

### Phase 2 — Local swap optimization (C)

After Phase 1 selects the best run, call `swapOptimize()` for ~500 rounds. Each round: pick two random non-pinned nodes, swap their positions, recompute crossing count, keep swap if count decreases, revert otherwise.

## New functions

### `countCrossings(edges, positions) → number`

Counts intersecting edge pairs using 2D segment intersection test.
- Complexity: O(e²) — ~2,600 pairs for 73 edges, sub-millisecond.
- Only tests edges whose both endpoints are present in `positions` (per-component safe).
- Uses standard cross-product / parameterized segment intersection. Collinear/endpoint touches not counted as crossings.

### `swapOptimize(ids, edges, positions, pinned, rounds) → void`

Mutates `positions` in place.
- Each round: pick two random indices from non-pinned ids, swap their `Point` values, count crossings, revert if worse or equal.
- Pinned nodes (self) never swapped.
- Returns after `rounds` iterations regardless of improvement.

## Integration into `computeForceLayout`

```
Per component:
  bestPositions = null, bestCrossings = Infinity
  repeat 6 times:
    positions = simulate(compIds, edges, 320, pinned)
    c = countCrossings(compEdges, positions)
    if c < bestCrossings: bestPositions = positions, bestCrossings = c
  swapOptimize(compIds, compEdges, bestPositions, pinned, 500)
  use bestPositions for this component
```

Grid layout and list view: unchanged.

## Performance

| Step | Cost |
|------|------|
| 6 × simulate (74 nodes, 320 iters) | ~200–400ms total |
| 6 × countCrossings (73 edges) | ~1ms total |
| swapOptimize (500 rounds) | ~5ms |
| **Total** | **~210–410ms** |

Current single-run layout: ~60ms. Acceptable increase — layout only runs on explicit user action or first load.

## Constraints

- Self node stays pinned at origin throughout — never moved by swap optimizer.
- `computeForceLayout` signature unchanged: `(nodes, edges) → Map<string, Point>`.
- Grid layout (`computeGridLayout`) untouched.
- No new npm dependencies.
