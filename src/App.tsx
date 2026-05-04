import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import {
  isSupported as excelSyncSupported,
  loadSavedHandle, clearSavedHandle, pickExcelFile,
  checkPermission, requestPermission, writeBackToExcel,
  type ExcelSyncStatus,
} from './services/excelSync'
import { ExcelSync } from './components/ExcelSync'
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  MiniMap,
  ConnectionMode,
  useReactFlow,
  type NodeMouseHandler,
} from '@xyflow/react'
import { Starfield } from './components/Starfield'
import { useNetworkStore } from './store/networkStore'
import { PersonNodeComponent } from './components/nodes/PersonNode'
import { JobNodeComponent } from './components/nodes/JobNode'
import { SelfNodeComponent } from './components/nodes/SelfNode'
import { NodePanel } from './components/NodePanel'
import { ImportModal } from './components/ImportModal'
import { Toolbar } from './components/Toolbar'
import { CalendarSync } from './components/CalendarSync'
import { StatsPanel, type ActiveFilter } from './components/StatsPanel'
import { ListView } from './components/ListView'
import type { AppNode, PersonData } from './types'
import { computeRadialLayout, computeGridLayout } from './utils/layout'
import './index.css'

const nodeTypes = {
  person: PersonNodeComponent,
  job: JobNodeComponent,
  self: SelfNodeComponent,
}

type PanelMode = 'add-person' | 'add-job' | 'edit'

function Flow() {
  const {
    nodes, edges,
    onNodesChange, onEdgesChange, onConnect,
    selectedNodeId, setSelectedNode, setNodePositions,
  } = useNetworkStore()

  const { fitView } = useReactFlow()
  const autoLayoutDone = useRef(false)

  const applyLayout = useCallback((mode: 'force' | 'grid') => {
    const positions = mode === 'force'
      ? computeRadialLayout(nodes, edges)
      : computeGridLayout(nodes, edges)
    // Only update the Zustand store — ReactFlow reads positions from the nodes prop
    setNodePositions(positions)
    setTimeout(() => fitView({ padding: 0.3 }), 80)
  }, [nodes, edges, setNodePositions, fitView])

  // Auto-run force layout on first load
  useEffect(() => {
    if (nodes.length > 0 && !autoLayoutDone.current) {
      autoLayoutDone.current = true
      setTimeout(() => applyLayout('force'), 120)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length])

  const [panelMode, setPanelMode] = useState<PanelMode | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | null>(null)
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph')
  const [currentLayout, setCurrentLayout] = useState<'force' | 'grid'>('force')

  // Excel auto-sync
  const [excelStatus, setExcelStatus] = useState<ExcelSyncStatus>('unlinked')
  const [excelFileName, setExcelFileName] = useState<string | undefined>()
  const excelHandleRef = useRef<FileSystemFileHandle | null>(null)
  const writebackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load saved file handle on mount
  useEffect(() => {
    if (!excelSyncSupported()) return
    loadSavedHandle().then(async (handle) => {
      if (!handle) return
      const perm = await checkPermission(handle)
      if (perm === 'granted') {
        excelHandleRef.current = handle
        setExcelStatus('linked')
        handle.getFile().then(f => setExcelFileName(f.name)).catch(() => {})
      } else {
        setExcelStatus('needs-permission')
      }
    })
  }, [])

  // Subscribe to store changes, debounce write-back
  useEffect(() => {
    const unsub = useNetworkStore.subscribe(async (state) => {
      if (!excelHandleRef.current) return
      if (writebackTimer.current) clearTimeout(writebackTimer.current)
      writebackTimer.current = setTimeout(async () => {
        setExcelStatus('syncing')
        try {
          await writeBackToExcel(state.nodes, excelHandleRef.current!)
          setExcelStatus('linked')
        } catch (err) {
          console.error('Excel write-back failed:', err)
          setExcelStatus('error')
        }
      }, 3000)
    })
    return () => {
      unsub()
      if (writebackTimer.current) clearTimeout(writebackTimer.current)
    }
  }, [])

  async function handleLinkExcel() {
    // If we have a handle but need permission, try requesting it (requires user gesture)
    if (excelStatus === 'needs-permission' && excelHandleRef.current) {
      const ok = await requestPermission(excelHandleRef.current)
      if (ok) {
        setExcelStatus('linked')
        return
      }
    }
    // Otherwise pick a new file
    const handle = await pickExcelFile()
    if (!handle) return
    excelHandleRef.current = handle
    setExcelStatus('linked')
    handle.getFile().then(f => setExcelFileName(f.name)).catch(() => {})
  }

  async function handleUnlinkExcel() {
    excelHandleRef.current = null
    setExcelStatus('unlinked')
    setExcelFileName(undefined)
    await clearSavedHandle()
  }

  // Pre-compute edge counts once per edges change — avoids useEdges() inside every node
  const edgeCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const e of edges) {
      counts.set(e.source, (counts.get(e.source) ?? 0) + 1)
      counts.set(e.target, (counts.get(e.target) ?? 0) + 1)
    }
    return counts
  }, [edges])

  // Apply dim/highlight based on active filter and inject edgeCount into node data
  const displayNodes = useMemo(() => {
    return nodes.map((n) => {
      const d = n.data as unknown as PersonData
      const edgeCount = edgeCounts.get(n.id) ?? 0
      const filtered = activeFilter && (() => {
        const val = (d[activeFilter.type as keyof PersonData] ?? '').toString().trim()
        const match = n.type === 'person' && val === activeFilter.value
        return { opacity: match ? 1 : 0.15, transition: 'opacity 0.2s' }
      })()
      return {
        ...n,
        data: { ...n.data, edgeCount },
        ...(filtered ? { style: { ...n.style, ...filtered } } : {}),
      }
    })
  }, [nodes, edges, activeFilter, edgeCounts])

  const displayEdges = useMemo(() =>
    edges.map(e => ({ ...e, style: { ...e.style, stroke: 'rgba(96, 165, 250, 0.60)', strokeWidth: 1.5 } })),
    [edges]
  )

  const onNodeClick: NodeMouseHandler<AppNode> = useCallback((_evt, node) => {
    if (node.type === 'self') { setSelectedNode(node.id); return }
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
        onForceLayout={() => { setViewMode('graph'); setCurrentLayout('force'); applyLayout('force') }}
        onGridLayout={() => { setViewMode('graph'); setCurrentLayout('grid'); applyLayout('grid') }}
        currentLayout={currentLayout}
        onListView={() => setViewMode('list')}
        viewMode={viewMode}
        nodeCount={nodes.length}
        edgeCount={edges.length}
        calendarSync={<CalendarSync />}
        excelSync={excelSyncSupported() ? (
          <ExcelSync
            status={excelStatus}
            fileName={excelFileName}
            onLink={handleLinkExcel}
            onUnlink={handleUnlinkExcel}
          />
        ) : undefined}
      />

      <Starfield />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        <StatsPanel
          nodes={nodes}
          activeFilter={activeFilter}
          onFilter={setActiveFilter}
        />

        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {viewMode === 'list' && (
            <ListView onSelectNode={(id) => { setSelectedNode(id); setPanelMode('edit') }} />
          )}
          {viewMode !== 'list' && <ReactFlow
            nodes={displayNodes}
            edges={displayEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            deleteKeyCode="Delete"
            minZoom={0.25}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            defaultEdgeOptions={{
              type: 'straight',
              style: { stroke: 'rgba(96, 165, 250, 0.60)', strokeWidth: 1.5 },
            }}
          >
            <Controls />
            <MiniMap
              nodeColor={(n) => n.type === 'job' ? '#a855f7' : '#3b82f6'}
              maskColor="rgba(2, 4, 9, 0.75)"
            />
          </ReactFlow>}

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
