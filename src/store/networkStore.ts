import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from '@xyflow/react'
import type { AppNode, PersonData, JobData } from '../types'

interface NetworkStore {
  nodes: AppNode[]
  edges: Edge[]
  selectedNodeId: string | null

  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect

  addPerson: (data: Omit<PersonData, 'nodeType'>) => void
  addJob: (data: Omit<JobData, 'nodeType'>) => void
  updateNode: (id: string, data: Partial<PersonData> | Partial<JobData>) => void
  deleteNode: (id: string) => void
  setSelectedNode: (id: string | null) => void
  importPeople: (people: Omit<PersonData, 'nodeType'>[], referredById?: string) => void
  setNodePositions: (positions: Map<string, { x: number; y: number }>) => void
}

function makeId() {
  return crypto.randomUUID()
}

function gridPosition(index: number): { x: number; y: number } {
  const col = index % 5
  const row = Math.floor(index / 5)
  return { x: 100 + col * 260, y: 100 + row * 200 }
}

export const useNetworkStore = create<NetworkStore>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      selectedNodeId: null,

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onNodesChange: (changes: any) =>
        set({ nodes: applyNodeChanges(changes, get().nodes as any) as AppNode[] }),

      onEdgesChange: (changes) =>
        set({ edges: applyEdgeChanges(changes, get().edges) }),

      onConnect: (connection) =>
        set({ edges: addEdge({ ...connection, id: makeId() }, get().edges) }),

      addPerson: (data) => {
        const nodeData: PersonData = { nodeType: 'person', ...data }
        const node: AppNode = {
          id: makeId(),
          type: 'person',
          position: gridPosition(get().nodes.length),
          data: nodeData as unknown as Record<string, unknown>,
        }
        set({ nodes: [...get().nodes, node] })
      },

      addJob: (data) => {
        const nodeData: JobData = { nodeType: 'job', ...data }
        const node: AppNode = {
          id: makeId(),
          type: 'job',
          position: gridPosition(get().nodes.length),
          data: nodeData as unknown as Record<string, unknown>,
        }
        set({ nodes: [...get().nodes, node] })
      },

      updateNode: (id, data) => {
        set({
          nodes: get().nodes.map((n) =>
            n.id === id
              ? { ...n, data: { ...n.data, ...data } as unknown as Record<string, unknown> }
              : n
          ),
        })
      },

      deleteNode: (id) => {
        set({
          nodes: get().nodes.filter((n) => n.id !== id),
          edges: get().edges.filter((e) => e.source !== id && e.target !== id),
          selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
        })
      },

      setSelectedNode: (id) => set({ selectedNodeId: id }),

      setNodePositions: (positions) => {
        set({
          nodes: get().nodes.map(n => {
            const p = positions.get(n.id)
            return p ? { ...n, position: p } : n
          })
        })
      },

      importPeople: (people, referredById) => {
        const baseIndex = get().nodes.length
        const newNodes: AppNode[] = people.map((p, i) => {
          const nodeData: PersonData = { nodeType: 'person', ...p }
          return {
            id: makeId(),
            type: 'person' as const,
            position: gridPosition(baseIndex + i),
            data: nodeData as unknown as Record<string, unknown>,
          }
        })

        const newEdges: Edge[] = referredById
          ? newNodes.map((n) => ({ id: makeId(), source: referredById, target: n.id }))
          : []

        set({
          nodes: [...get().nodes, ...newNodes],
          edges: [...get().edges, ...newEdges],
        })
      },
    }),
    { name: 'network-app-storage' }
  )
)
