# Crossing-Minimization Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the constellation (force) layout to minimize edge crossings by running the simulation 6 times and keeping the best result, then polishing with a local swap optimizer.

**Architecture:** Two pure helper functions (`countCrossings`, `swapOptimize`) added to `layout.ts`. `computeForceLayout` updated to run `simulate` 6 times per component, score each with `countCrossings`, keep the best, then call `swapOptimize` for 500 rounds. Grid and list layouts untouched.

**Tech Stack:** TypeScript, Vitest (new dev dep for unit tests)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `src/utils/layout.ts` | Add `segmentsIntersect`, `direction`, `countCrossings`, `swapOptimize`; update `computeForceLayout` |
| Create | `src/utils/layout.test.ts` | Unit tests for `countCrossings` and `swapOptimize` |
| Modify | `vite.config.ts` | Add vitest config block |

---

### Task 1: Install vitest and configure

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: Install vitest**

```bash
cd ~/projects/network-app && npm install --save-dev vitest
```

Expected: vitest appears in `package.json` devDependencies.

- [ ] **Step 2: Add test script to package.json**

Open `package.json`. In the `"scripts"` block, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Add vitest config to vite.config.ts**

Replace the contents of `vite.config.ts` with:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 4: Verify vitest runs**

```bash
cd ~/projects/network-app && npm test
```

Expected output: `No test files found` (or similar — not an error, just no tests yet).

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts package.json package-lock.json
git commit -m "chore: add vitest for unit tests"
```

---

### Task 2: Add `countCrossings` with tests

**Files:**
- Modify: `src/utils/layout.ts`
- Create: `src/utils/layout.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/utils/layout.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { countCrossings } from './layout'

// Simple helper to build positions map
function pos(entries: [string, [number, number]][]) {
  return new Map(entries.map(([id, [x, y]]) => [id, { x, y }]))
}

describe('countCrossings', () => {
  it('returns 0 for empty edges', () => {
    expect(countCrossings([], new Map())).toBe(0)
  })

  it('returns 0 for single edge', () => {
    const positions = pos([['a', [0, 0]], ['b', [1, 1]]])
    expect(countCrossings([{ source: 'a', target: 'b' }], positions)).toBe(0)
  })

  it('returns 0 for parallel non-crossing edges', () => {
    // Two horizontal lines stacked vertically
    const positions = pos([
      ['a', [0, 0]], ['b', [2, 0]],
      ['c', [0, 1]], ['d', [2, 1]],
    ])
    const edges = [
      { source: 'a', target: 'b' },
      { source: 'c', target: 'd' },
    ]
    expect(countCrossings(edges, positions)).toBe(0)
  })

  it('returns 1 for two crossing edges forming an X', () => {
    // Diagonal from (0,0)→(2,2) crosses (0,2)→(2,0)
    const positions = pos([
      ['a', [0, 0]], ['b', [2, 2]],
      ['c', [0, 2]], ['d', [2, 0]],
    ])
    const edges = [
      { source: 'a', target: 'b' },
      { source: 'c', target: 'd' },
    ]
    expect(countCrossings(edges, positions)).toBe(1)
  })

  it('returns 0 for edges sharing a node', () => {
    // Two edges from same hub — they share 'a', cannot cross
    const positions = pos([
      ['a', [1, 1]], ['b', [0, 0]], ['c', [2, 0]],
    ])
    const edges = [
      { source: 'a', target: 'b' },
      { source: 'a', target: 'c' },
    ]
    expect(countCrossings(edges, positions)).toBe(0)
  })

  it('returns 0 for edges whose endpoints are not in positions', () => {
    const positions = pos([['a', [0, 0]], ['b', [1, 1]]])
    // edge references 'c' which is not in positions
    const edges = [
      { source: 'a', target: 'b' },
      { source: 'c', target: 'd' },
    ]
    expect(countCrossings(edges, positions)).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd ~/projects/network-app && npm test
```

Expected: FAIL — `countCrossings is not exported` (or similar import error).

- [ ] **Step 3: Add helper functions and `countCrossings` to layout.ts**

Open `src/utils/layout.ts`. Add these functions **before** `computeForceLayout` (after the `simulate` function, around line 103):

```typescript
function direction(pi: Point, pj: Point, pk: Point): number {
  return (pk.x - pi.x) * (pj.y - pi.y) - (pj.x - pi.x) * (pk.y - pi.y)
}

function segmentsIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const d1 = direction(p3, p4, p1)
  const d2 = direction(p3, p4, p2)
  const d3 = direction(p1, p2, p3)
  const d4 = direction(p1, p2, p4)
  return (
    ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
  )
}

export function countCrossings(
  edges: { source: string; target: string }[],
  positions: Map<string, Point>
): number {
  const local = edges.filter(e => positions.has(e.source) && positions.has(e.target))
  let count = 0
  for (let i = 0; i < local.length; i++) {
    for (let j = i + 1; j < local.length; j++) {
      const a = local[i], b = local[j]
      if (a.source === b.source || a.source === b.target ||
          a.target === b.source || a.target === b.target) continue
      const p1 = positions.get(a.source)!, p2 = positions.get(a.target)!
      const p3 = positions.get(b.source)!, p4 = positions.get(b.target)!
      if (segmentsIntersect(p1, p2, p3, p4)) count++
    }
  }
  return count
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd ~/projects/network-app && npm test
```

Expected: all 6 `countCrossings` tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/layout.ts src/utils/layout.test.ts
git commit -m "feat: add countCrossings with segment intersection test"
```

---

### Task 3: Add `swapOptimize` with tests

**Files:**
- Modify: `src/utils/layout.ts`
- Modify: `src/utils/layout.test.ts`

- [ ] **Step 1: Add tests for `swapOptimize`**

First, update the import at the top of `src/utils/layout.test.ts` to also import `swapOptimize`:

```typescript
import { countCrossings, swapOptimize } from './layout'
```

Then append the following describe block to the end of `src/utils/layout.test.ts`:

```typescript

describe('swapOptimize', () => {
  it('does not move pinned nodes', () => {
    // 'a' pinned at origin. After optimization, must stay at (0,0).
    const positions = new Map([
      ['a', { x: 0, y: 0 }],
      ['b', { x: 1, y: 0 }],
      ['c', { x: 2, y: 0 }],
    ])
    const edges = [{ source: 'a', target: 'b' }, { source: 'b', target: 'c' }]
    swapOptimize(['a', 'b', 'c'], edges, positions, new Set(['a']), 200)
    expect(positions.get('a')).toEqual({ x: 0, y: 0 })
  })

  it('does not increase crossings', () => {
    // X-crossing configuration: a-b crosses c-d
    const positions = new Map([
      ['a', { x: 0, y: 0 }], ['b', { x: 2, y: 2 }],
      ['c', { x: 0, y: 2 }], ['d', { x: 2, y: 0 }],
    ])
    const edges = [
      { source: 'a', target: 'b' },
      { source: 'c', target: 'd' },
    ]
    const before = countCrossings(edges, positions)
    swapOptimize(['a', 'b', 'c', 'd'], edges, positions, new Set(), 500)
    const after = countCrossings(edges, positions)
    expect(after).toBeLessThanOrEqual(before)
  })

  it('returns early with fewer than 2 movable nodes', () => {
    const positions = new Map([['a', { x: 0, y: 0 }]])
    // Should not throw
    swapOptimize(['a'], [], positions, new Set(), 100)
    expect(positions.get('a')).toEqual({ x: 0, y: 0 })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd ~/projects/network-app && npm test
```

Expected: FAIL — `swapOptimize is not exported`.

- [ ] **Step 3: Add `swapOptimize` to layout.ts**

Add this function immediately after `countCrossings` in `src/utils/layout.ts`:

```typescript
export function swapOptimize(
  ids: string[],
  edges: { source: string; target: string }[],
  positions: Map<string, Point>,
  pinned: Set<string>,
  rounds: number
): void {
  const movable = ids.filter(id => !pinned.has(id))
  if (movable.length < 2) return
  let current = countCrossings(edges, positions)
  for (let r = 0; r < rounds; r++) {
    const i = Math.floor(Math.random() * movable.length)
    let j = Math.floor(Math.random() * (movable.length - 1))
    if (j >= i) j++
    const a = movable[i], b = movable[j]
    const pa = positions.get(a)!
    const pb = positions.get(b)!
    positions.set(a, pb)
    positions.set(b, pa)
    const next = countCrossings(edges, positions)
    if (next < current) {
      current = next
    } else {
      positions.set(a, pa)
      positions.set(b, pb)
    }
  }
}
```

- [ ] **Step 4: Run all tests to verify they pass**

```bash
cd ~/projects/network-app && npm test
```

Expected: all 9 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/layout.ts src/utils/layout.test.ts
git commit -m "feat: add swapOptimize local search for crossing reduction"
```

---

### Task 4: Wire multi-run + swap into `computeForceLayout`

**Files:**
- Modify: `src/utils/layout.ts:161-178` (the `layouts` map inside `computeForceLayout`)

- [ ] **Step 1: Replace the single-run `layouts` map with multi-run logic**

In `src/utils/layout.ts`, find this block inside `computeForceLayout` (currently around line 161):

```typescript
  const layouts = components.map(ids => {
    const positions = simulate(ids, edges, 320, pinned)
    return { ids, positions, radius: boundingRadius(positions) }
  })
```

Replace it with:

```typescript
  const layouts = components.map(compIds => {
    const compIdSet = new Set(compIds)
    const compEdges = edges.filter(e => compIdSet.has(e.source) && compIdSet.has(e.target))

    let bestPositions: Map<string, Point> = simulate(compIds, edges, 320, pinned)
    let bestCrossings = countCrossings(compEdges, bestPositions)

    for (let run = 1; run < 6; run++) {
      const positions = simulate(compIds, edges, 320, pinned)
      const c = countCrossings(compEdges, positions)
      if (c < bestCrossings) {
        bestCrossings = c
        bestPositions = positions
      }
    }

    swapOptimize(compIds, compEdges, bestPositions, pinned, 500)

    return { ids: compIds, positions: bestPositions, radius: boundingRadius(bestPositions) }
  })
```

- [ ] **Step 2: Run all tests to confirm nothing broke**

```bash
cd ~/projects/network-app && npm test
```

Expected: all 9 tests still PASS.

- [ ] **Step 3: Run TypeScript check**

```bash
cd ~/projects/network-app && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Verify in browser**

Dev server should already be running on port 5176. Open `http://localhost:5176`. Click the "Force" layout button a few times and verify:
- Layout renders without error
- Graph looks similar to before (same spring aesthetic, not radically different)
- No console errors

- [ ] **Step 5: Commit**

```bash
git add src/utils/layout.ts
git commit -m "feat: multi-run + swap optimizer for constellation layout crossing minimization"
```
