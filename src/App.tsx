import { useState, useCallback, useMemo } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  MiniMap,
  type NodeMouseHandler,
} from '@xyflow/react'
import { Starfield } from './components/Starfield'
import { useNetworkStore } from './store/networkStore'
import { PersonNodeComponent } from './components/nodes/PersonNode'
import { JobNodeComponent } from './components/nodes/JobNode'
import { NodePanel } from './components/NodePanel'
import { ImportModal } from './components/ImportModal'
import { Toolbar } from './components/Toolbar'
import { StatsPanel, type ActiveFilter } from './components/StatsPanel'
import type { AppNode, PersonData } from './types'
import './index.css'

const nodeTypes = {
  person: PersonNodeComponent,
  job: JobNodeComponent,
}

type PanelMode = 'add-person' | 'add-job' | 'edit'

function Flow() {
  const {
    nodes, edges,
    onNodesChange, onEdgesChange, onConnect,
    selectedNodeId, setSelectedNode,
  } = useNetworkStore()

  const [panelMode, setPanelMode] = useState<PanelMode | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | null>(null)

  // Apply dim/highlight based on active filter
  const displayNodes = useMemo(() => {
    if (!activeFilter) return nodes
    return nodes.map((n) => {
      if (n.type !== 'person') return n
      const d = n.data as unknown as PersonData
      const val = (d[activeFilter.type] ?? '').trim()
      const match = val === activeFilter.value
      return {
        ...n,
        style: {
          ...n.style,
          opacity: match ? 1 : 0.15,
          transition: 'opacity 0.2s',
        },
      }
    })
  }, [nodes, activeFilter])

  const onNodeClick: NodeMouseHandler<AppNode> = useCallback((_evt, node) => {
    setSelectedNode(node.id)
    setPanelMode('edit')
  }, [setSelectedNode])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
    setPanelMode(null)
  }, [setSelectedNode])

  function openAdd(mode: 'add-person' | 'add-job') {
    setSelectedNode(null)
    setPanelMode(mode)
  }

  function closePanel() {
    setPanelMode(null)
    setSelectedNode(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#020409' }}>
      <Toolbar
        onAddPerson={() => openAdd('add-person')}
        onAddJob={() => openAdd('add-job')}
        onImport={() => setShowImport(true)}
        nodeCount={nodes.length}
        edgeCount={edges.length}
      />

      <Starfield />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        <StatsPanel
          nodes={nodes}
          activeFilter={activeFilter}
          onFilter={setActiveFilter}
        />

        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlow
            nodes={displayNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            deleteKeyCode="Delete"
            fitView
            fitViewOptions={{ padding: 0.3 }}
            defaultEdgeOptions={{
              type: 'straight',
              style: { stroke: 'rgba(147, 197, 253, 0.22)', strokeWidth: 1 },
            }}
          >
            <Controls />
            <MiniMap
              nodeColor={(n) => n.type === 'job' ? '#a855f7' : '#3b82f6'}
              maskColor="rgba(2, 4, 9, 0.75)"
            />
          </ReactFlow>

          {panelMode && (
            <NodePanel
              mode={panelMode}
              nodeId={panelMode === 'edit' ? selectedNodeId ?? undefined : undefined}
              onClose={closePanel}
            />
          )}

          {nodes.length === 0 && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'rgba(147, 197, 253, 0.25)', fontSize: 18, fontWeight: 600, margin: 0, letterSpacing: '0.05em' }}>
                  ✦ Your constellation is empty ✦
                </p>
                <p style={{ color: 'rgba(147, 197, 253, 0.12)', fontSize: 13, marginTop: 8 }}>
                  Add a contact or import CSV to map your stars
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
    </div>
  )
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  )
}
