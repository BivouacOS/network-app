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
