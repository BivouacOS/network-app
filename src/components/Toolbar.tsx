import React from 'react'
import { UserPlus, Briefcase, Upload, Orbit, List } from 'lucide-react'

interface Props {
  onAddPerson: () => void
  onAddJob: () => void
  onImport: () => void
  onForceLayout: () => void
  onListView: () => void
  viewMode: 'graph' | 'list'
  nodeCount: number
  edgeCount: number
  calendarSync?: React.ReactNode
  excelSync?: React.ReactNode
}

export function Toolbar({ onAddPerson, onAddJob, onImport, onForceLayout, onListView, viewMode, nodeCount, edgeCount, calendarSync, excelSync }: Props) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '8px 16px',
      background: 'rgba(2, 4, 9, 0.82)',
      borderBottom: '1px solid rgba(147, 197, 253, 0.1)',
      backdropFilter: 'blur(12px)',
      flexShrink: 0, zIndex: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
        <span style={{ fontSize: 16 }}>✦</span>
        <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14, letterSpacing: '0.04em' }}>
          Constellation
        </span>
        <span style={{ color: 'rgba(147, 197, 253, 0.35)', fontSize: 12, marginLeft: 4 }}>
          {nodeCount} stars · {edgeCount} links
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
        <ToolBtn onClick={onAddPerson} icon={<UserPlus size={19} />} label="Contact" glow="#3b82f6" />
        <ToolBtn onClick={onAddJob} icon={
          <span style={{ position: 'relative', display: 'inline-flex' }}>
            <Briefcase size={19} />
            <span style={{ position: 'absolute', top: -3, left: -5, fontSize: 11, fontWeight: 700, lineHeight: 1 }}>+</span>
          </span>
        } label="Job" glow="#a855f7" />
        <ToolBtn onClick={onImport} icon={<Upload size={19} />} label="Import" glow="#475569" />
        <div style={{ width: 1, height: 32, background: 'rgba(147,197,253,0.1)', margin: '0 2px' }} />
        <ToolBtn onClick={onForceLayout} icon={<Orbit size={19} />} label="Stellar" glow="#06b6d4" active={viewMode === 'graph'} />
        <ToolBtn onClick={onListView} icon={<List size={19} />} label="List" glow="#22c55e" active={viewMode === 'list'} />
        {calendarSync && (
          <>
            <div style={{ width: 1, height: 32, background: 'rgba(147,197,253,0.1)', margin: '0 2px' }} />
            {calendarSync}
          </>
        )}
        {excelSync && (
          <>
            <div style={{ width: 1, height: 32, background: 'rgba(147,197,253,0.1)', margin: '0 2px' }} />
            {excelSync}
          </>
        )}
      </div>

      <span style={{ color: 'rgba(147, 197, 253, 0.18)', fontSize: 11, marginLeft: 8 }} className="hidden lg:block">
        Drag handles to connect · Delete to remove
      </span>
    </div>
  )
}

function ToolBtn({ onClick, icon, label, glow, active }: {
  onClick: () => void
  icon: React.ReactNode
  label: string
  glow: string
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 3,
        width: 48, padding: '6px 4px', borderRadius: 8,
        background: active ? `${glow}30` : `${glow}18`,
        border: `1px solid ${active ? glow + '88' : glow + '44'}`,
        color: active ? '#f1f5f9' : '#94a3b8',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.background = `${glow}30`
        el.style.borderColor = `${glow}88`
        el.style.color = '#f1f5f9'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.background = active ? `${glow}30` : `${glow}18`
        el.style.borderColor = active ? `${glow}88` : `${glow}44`
        el.style.color = active ? '#f1f5f9' : '#94a3b8'
      }}
    >
      {icon}
      <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.02em', lineHeight: 1 }}>{label}</span>
    </button>
  )
}
