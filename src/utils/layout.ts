interface Point { x: number; y: number }

// Horizontal stretch factor — biases layouts toward landscape aspect ratio
const ASPECT_X = 1.55

// Post-layout deoverlap: nudge nodes apart until no pair is closer than minSep.
// Completely decoupled from force sim — remove the call site to revert.
function deoverlap(
  positions: Map<string, Point>,
  pinned: Set<string>,
  minSep = 185,
  iters = 20
): void {
  const ids = [...positions.keys()]
  for (let it = 0; it < iters; it++) {
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i], b = ids[j]
        const pa = positions.get(a)!, pb = positions.get(b)!
        const dx = pa.x - pb.x, dy = pa.y - pb.y
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d >= minSep || d === 0) continue
        const push = (minSep - d) / 2
        const nx = dx / d * push, ny = dy / d * push
        if (!pinned.has(a)) { pa.x += nx; pa.y += ny }
        if (!pinned.has(b)) { pb.x -= nx; pb.y -= ny }
      }
    }
  }
}

function buildAdj(ids: string[], edges: { source: string; target: string }[]) {
  const adj = new Map<string, Set<string>>()
  for (const id of ids) adj.set(id, new Set())
  for (const e of edges) {
    adj.get(e.source)?.add(e.target)
    adj.get(e.target)?.add(e.source)
  }
  return adj
}

function findComponents(ids: string[], adj: Map<string, Set<string>>) {
  const visited = new Set<string>()
  const components: string[][] = []
  for (const id of ids) {
    if (visited.has(id)) continue
    const comp: string[] = []
    const queue = [id]
    while (queue.length) {
      const cur = queue.shift()!
      if (visited.has(cur)) continue
      visited.add(cur); comp.push(cur)
      for (const nb of adj.get(cur) ?? []) if (!visited.has(nb)) queue.push(nb)
    }
    components.push(comp)
  }
  return components
}

function simulate(ids: string[], edges: { source: string; target: string }[], iters = 320, pinned = new Set<string>()): Map<string, Point> {
  const n = ids.length
  const pos = new Map<string, Point>()
  const vel = new Map<string, Point>()

  // Seed positions on a jittered circle so simulation starts spread out
  ids.forEach((id, i) => {
    const angle = (2 * Math.PI * i) / n + (Math.random() - 0.5) * 0.6
    const r = Math.sqrt(n) * 70 + Math.random() * 40
    pos.set(id, { x: r * Math.cos(angle), y: r * Math.sin(angle) })
    vel.set(id, { x: 0, y: 0 })
  })

  const localEdges = edges.filter(e => pos.has(e.source) && pos.has(e.target))
  const K_REP = 14000
  const K_ATT = 0.9
  const K_GRAV = 0.005
  const REST = 160
  const DAMP = 0.80

  for (let iter = 0; iter < iters; iter++) {
    const f = new Map<string, Point>()
    for (const id of ids) f.set(id, { x: 0, y: 0 })

    // Repulsion — all pairs
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = ids[i], b = ids[j]
        const pa = pos.get(a)!, pb = pos.get(b)!
        const dx = pa.x - pb.x, dy = pa.y - pb.y
        const d2 = Math.max(1, dx * dx + dy * dy)
        const d = Math.sqrt(d2)
        const mag = K_REP / d2
        f.get(a)!.x += mag * dx / d; f.get(a)!.y += mag * dy / d
        f.get(b)!.x -= mag * dx / d; f.get(b)!.y -= mag * dy / d
      }
    }

    // Attraction — edges
    for (const e of localEdges) {
      const pa = pos.get(e.source)!, pb = pos.get(e.target)!
      const dx = pb.x - pa.x, dy = pb.y - pa.y
      const d = Math.max(1, Math.sqrt(dx * dx + dy * dy))
      const mag = K_ATT * Math.log(Math.max(1, d / REST))
      f.get(e.source)!.x += mag * dx / d; f.get(e.source)!.y += mag * dy / d
      f.get(e.target)!.x -= mag * dx / d; f.get(e.target)!.y -= mag * dy / d
    }

    // Gravity — weak pull toward origin prevents leaf nodes from drifting
    for (const id of ids) {
      if (pinned.has(id)) continue
      const p = pos.get(id)!
      f.get(id)!.x -= K_GRAV * p.x
      f.get(id)!.y -= K_GRAV * p.y
    }

    // Integrate — cooling schedule
    const cool = Math.max(0.05, 1 - iter / iters)
    for (const id of ids) {
      if (pinned.has(id)) { pos.set(id, { x: 0, y: 0 }); continue }
      const v = vel.get(id)!, fi = f.get(id)!, p = pos.get(id)!
      v.x = (v.x + fi.x) * DAMP * cool
      v.y = (v.y + fi.y) * DAMP * cool
      p.x += v.x; p.y += v.y
    }
  }

  // Center component at origin — anchor on pinned node if present,
  // otherwise use centroid. Centroid recentering would drift pinned nodes off (0,0).
  let cx = 0, cy = 0
  const pinnedId = ids.find(id => pinned.has(id))
  if (pinnedId) {
    const p = pos.get(pinnedId)!
    cx = p.x; cy = p.y
  } else {
    for (const id of ids) { cx += pos.get(id)!.x; cy += pos.get(id)!.y }
    cx /= n; cy /= n
  }
  for (const id of ids) {
    pos.get(id)!.x = (pos.get(id)!.x - cx) * ASPECT_X
    pos.get(id)!.y -= cy
  }

  return pos
}

function boundingRadius(positions: Map<string, Point>): number {
  let r = 0
  for (const p of positions.values()) r = Math.max(r, Math.sqrt(p.x ** 2 + p.y ** 2))
  return r + 120 // padding between constellations
}

function direction(pi: Point, pj: Point, pk: Point): number {
  return (pj.x - pi.x) * (pk.y - pi.y) - (pj.y - pi.y) * (pk.x - pi.x)
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
  if (current === 0) return
  for (let r = 0; r < rounds; r++) {
    const i = Math.floor(Math.random() * movable.length)
    let j = Math.floor(Math.random() * (movable.length - 1))
    if (j >= i) j++
    const a = movable[i], b = movable[j]
    const pa = { ...positions.get(a)! }
    const pb = { ...positions.get(b)! }
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

function packComponents(radii: number[]): Point[] {
  if (radii.length === 0) return []
  // Golden-angle spiral packing — organic, not grid-like
  const centers: Point[] = [{ x: 0, y: 0 }]
  const placed = [{ cx: 0, cy: 0, r: radii[0] }]

  for (let i = 1; i < radii.length; i++) {
    const r = radii[i]
    let angle = i * 2.399963 // golden angle in radians
    let dist = radii[0] + r + 320

    // Spiral outward until non-overlapping position found
    for (let attempt = 0; attempt < 400; attempt++) {
      const cx = Math.cos(angle) * dist * ASPECT_X
      const cy = Math.sin(angle) * dist
      let ok = true
      for (const p of placed) {
        if (Math.sqrt((cx - p.cx) ** 2 + (cy - p.cy) ** 2) < r + p.r + 280) {
          ok = false; break
        }
      }
      if (ok) { centers.push({ x: cx, y: cy }); placed.push({ cx, cy, r }); break }
      angle += 0.37
      dist += 20
    }
    // Fallback if no position found
    if (centers.length <= i) {
      const cx = Math.cos(angle) * dist * ASPECT_X, cy = Math.sin(angle) * dist
      centers.push({ x: cx, y: cy }); placed.push({ cx, cy, r })
    }
  }
  return centers
}

export function computeForceLayout(
  nodes: { id: string; type?: string }[],
  edges: { source: string; target: string }[]
): Map<string, Point> {
  const ids = nodes.map(n => n.id)
  const pinned = new Set(nodes.filter(n => n.type === 'self').map(n => n.id))
  const adj = buildAdj(ids, edges)
  const components = findComponents(ids, adj)

  // Component containing self node goes first (rendered at center)
  components.sort((a, b) => {
    const aHasSelf = a.some(id => pinned.has(id)) ? 1 : 0
    const bHasSelf = b.some(id => pinned.has(id)) ? 1 : 0
    return bHasSelf - aHasSelf || b.length - a.length
  })

  const layouts = components.map(compIds => {
    const compIdSet = new Set(compIds)
    const compEdges = edges.filter(e => compIdSet.has(e.source) && compIdSet.has(e.target))

    // Isolated node — skip simulation, place at origin with small radius
    if (compIds.length === 1 && compEdges.length === 0) {
      const positions = new Map([[compIds[0], { x: 0, y: 0 }]])
      return { ids: compIds, positions, radius: 60 }
    }

    let bestPositions: Map<string, Point> = simulate(compIds, compEdges, 320, pinned)
    let bestCrossings = countCrossings(compEdges, bestPositions)

    if (bestCrossings > 0) {
      for (let run = 1; run < 6; run++) {
        const positions = simulate(compIds, compEdges, 320, pinned)
        const c = countCrossings(compEdges, positions)
        if (c < bestCrossings) {
          bestCrossings = c
          bestPositions = positions
        }
      }
    }

    swapOptimize(compIds, compEdges, bestPositions, pinned, 2000)
    deoverlap(bestPositions, pinned)

    return { ids: compIds, positions: bestPositions, radius: boundingRadius(bestPositions) }
  })

  const centers = packComponents(layouts.map(l => l.radius))

  const MARGIN = 500
  const result = new Map<string, Point>()
  for (let i = 0; i < layouts.length; i++) {
    const { ids: compIds, positions } = layouts[i]
    const { x: ox, y: oy } = centers[i]
    for (const id of compIds) {
      const p = positions.get(id)!
      result.set(id, { x: ox + p.x + MARGIN, y: oy + p.y + MARGIN })
    }
  }
  return result
}

// Radial (spiderweb) layout — BFS from self, concentric rings by depth, angular sectors
// proportional to subtree size. Zero edge crossings within the spanning tree by construction.
export function computeRadialLayout(
  nodes: { id: string; type?: string; data?: Record<string, unknown> }[],
  edges: { source: string; target: string }[]
): Map<string, Point> {
  const RING_GAP = 375
  const RING_DECAY = 0.89  // each successive ring gap ~11% shorter than previous
  const MARGIN = 500
  const CLOSE_RELATIONSHIPS = new Set(['wife', 'husband', 'son', 'daughter'])
  const closeIds = new Set(nodes.filter(n => CLOSE_RELATIONSHIPS.has(((n.data?.relationship as string) ?? '').toLowerCase())).map(n => n.id))

  // Radius of ring d: cumulative sum of decaying gaps
  const ringRadius = (d: number): number => {
    let r = 0, gap = RING_GAP
    for (let i = 0; i < d; i++) { r += gap; gap *= RING_DECAY }
    return r
  }
  const result = new Map<string, Point>()

  const selfId = nodes.find(n => n.type === 'self')?.id
  const adj = new Map<string, string[]>()
  for (const n of nodes) adj.set(n.id, [])
  for (const e of edges) {
    adj.get(e.source)?.push(e.target)
    adj.get(e.target)?.push(e.source)
  }

  if (!selfId) {
    nodes.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / nodes.length
      result.set(n.id, { x: MARGIN + 400 * Math.cos(angle), y: MARGIN + 400 * Math.sin(angle) })
    })
    return result
  }

  // BFS from self — build spanning tree
  const depth = new Map<string, number>([[selfId, 0]])
  const parentMap = new Map<string, string>()
  const bfsQueue = [selfId]
  const bfsOrder = [selfId]

  while (bfsQueue.length) {
    const cur = bfsQueue.shift()!
    for (const nb of (adj.get(cur) ?? [])) {
      if (!depth.has(nb)) {
        depth.set(nb, depth.get(cur)! + 1)
        parentMap.set(nb, cur)
        bfsQueue.push(nb)
        bfsOrder.push(nb)
      }
    }
  }

  // Build children map and subtree sizes (deepest-first)
  const children = new Map<string, string[]>()
  for (const id of bfsOrder) children.set(id, [])
  for (const [id, par] of parentMap) children.get(par)!.push(id)

  const subtreeSize = new Map<string, number>()
  for (let i = bfsOrder.length - 1; i >= 0; i--) {
    const id = bfsOrder[i]
    const kids = children.get(id)!
    subtreeSize.set(id, 1 + kids.reduce((s, c) => s + subtreeSize.get(c)!, 0))
  }

  // Assign angular sectors top-down, place nodes at midpoint of their sector
  const lo = new Map<string, number>([[selfId, 0]])
  const hi = new Map<string, number>([[selfId, 2 * Math.PI]])

  for (const id of bfsOrder) {
    const d = depth.get(id)!
    if (d === 0) {
      result.set(id, { x: 0, y: 0 })
    } else {
      const angle = (lo.get(id)! + hi.get(id)!) / 2
      const r = ringRadius(d) * (closeIds.has(id) ? 0.3 : 1)
      const rj = r + (Math.random() - 0.5) * RING_GAP * 0.18
      const aj = angle + (Math.random() - 0.5) * 0.09
      result.set(id, { x: rj * Math.cos(aj), y: rj * Math.sin(aj) })
    }
    const kids = children.get(id)!
    if (kids.length === 0) continue
    const slo = lo.get(id)!, shi = hi.get(id)!
    // Minimum weight of 3 per child prevents leaf nodes from getting tiny sectors
    const weights = kids.map(kid => Math.max(3, subtreeSize.get(kid)!))
    const total = weights.reduce((s, w) => s + w, 0)
    let cur = slo
    for (let k = 0; k < kids.length; k++) {
      const end = cur + (shi - slo) * weights[k] / total
      lo.set(kids[k], cur)
      hi.set(kids[k], end)
      cur = end
    }
  }

  // Handle nodes not reachable from self — place as mini spiderwebs in outer ring
  const unreachable = nodes.filter(n => !depth.has(n.id))
  if (unreachable.length > 0) {
    let maxR = 0
    for (const p of result.values()) maxR = Math.max(maxR, Math.sqrt(p.x ** 2 + p.y ** 2))
    const outerR = maxR + RING_GAP * 1.5

    const uAdj = new Map<string, string[]>()
    for (const n of unreachable) uAdj.set(n.id, [])
    for (const e of edges) {
      if (uAdj.has(e.source) && uAdj.has(e.target)) {
        uAdj.get(e.source)!.push(e.target)
        uAdj.get(e.target)!.push(e.source)
      }
    }
    const uIds = unreachable.map(n => n.id)
    const uComps = findComponents(uIds, buildAdj(uIds, edges))
    uComps.sort((a, b) => b.length - a.length)

    uComps.forEach((comp, ci) => {
      const angle = (2 * Math.PI * ci) / uComps.length
      const hub = comp.reduce((a, b) => (uAdj.get(a)?.length ?? 0) >= (uAdj.get(b)?.length ?? 0) ? a : b)
      const hx = outerR * Math.cos(angle), hy = outerR * Math.sin(angle)
      result.set(hub, { x: hx, y: hy })
      comp.filter(id => id !== hub).forEach((id, li, arr) => {
        const la = angle + (li - (arr.length - 1) / 2) * (0.9 / Math.max(1, arr.length))
        result.set(id, { x: hx + 160 * Math.cos(la), y: hy + 160 * Math.sin(la) })
      })
    })
  }

  // Stretch horizontally, then deoverlap, then reduce crossings, then shift to MARGIN
  for (const [id, p] of result) result.set(id, { x: p.x * ASPECT_X, y: p.y })
  const selfPinned = new Set(nodes.filter(n => n.type === 'self').map(n => n.id))
  deoverlap(result, selfPinned)
  swapOptimize(nodes.map(n => n.id), edges, result, selfPinned, 2000)
  let minX = Infinity, minY = Infinity
  for (const p of result.values()) { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y) }
  for (const [id, p] of result) result.set(id, { x: p.x - minX + MARGIN, y: p.y - minY + MARGIN })
  return result
}

// Grid layout — nodes arranged in a grid per constellation, constellations packed with separation
export function computeGridLayout(
  nodes: { id: string }[],
  edges: { source: string; target: string }[]
): Map<string, Point> {
  const ids = nodes.map(n => n.id)
  const adj = buildAdj(ids, edges)
  const components = findComponents(ids, adj)
  components.sort((a, b) => b.length - a.length)

  const COL_GAP = 280
  const ROW_GAP = 220
  const PADDING = 160

  interface GridLayout { ids: string[]; positions: Map<string, Point>; w: number; h: number }
  const layouts: GridLayout[] = []

  for (const compIds of components) {
    // Sort by degree descending so hub nodes come first (top-left)
    const sorted = [...compIds].sort((a, b) => (adj.get(b)?.size ?? 0) - (adj.get(a)?.size ?? 0))
    const cols = Math.ceil(Math.sqrt(sorted.length * 1.4 * ASPECT_X))
    const positions = new Map<string, Point>()
    sorted.forEach((id, i) => {
      positions.set(id, {
        x: (i % cols) * COL_GAP,
        y: Math.floor(i / cols) * ROW_GAP,
      })
    })
    const rows = Math.ceil(sorted.length / cols)
    layouts.push({
      ids: sorted,
      positions,
      w: cols * COL_GAP + PADDING,
      h: rows * ROW_GAP + PADDING,
    })
  }

  // Pack component bounding boxes — convert to radius for packComponents
  const radii = layouts.map(l => Math.sqrt(l.w ** 2 + l.h ** 2) / 2)
  const centers = packComponents(radii)

  const MARGIN = 500
  const result = new Map<string, Point>()
  for (let i = 0; i < layouts.length; i++) {
    const { ids, positions, w, h } = layouts[i]
    const { x: ox, y: oy } = centers[i]
    // Center the grid block at the component center
    for (const id of ids) {
      const p = positions.get(id)!
      result.set(id, { x: ox + p.x - w / 2 + MARGIN, y: oy + p.y - h / 2 + MARGIN })
    }
  }
  return result
}
