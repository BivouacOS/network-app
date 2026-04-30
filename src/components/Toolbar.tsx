import { UserPlus, Briefcase, Upload } from 'lucide-react'

interface Props {
  onAddPerson: () => void
  onAddJob: () => void
  onImport: () => void
  nodeCount: number
  edgeCount: number
}

export function Toolbar({ onAddPerson, onAddJob, onImport, nodeCount, edgeCount }: Props) {
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
        <ToolBtn onClick={onAddPerson} icon={<UserPlus size={13} />} label="Add Contact" glow="#3b82f6" />
        <ToolBtn onClick={onAddJob} icon={<Briefcase size={13} />} label="Add Job" glow="#a855f7" />
        <ToolBtn onClick={onImport} icon={<Upload size={13} />} label="Import CSV" glow="#475569" />
      </div>

      <span style={{ color: 'rgba(147, 197, 253, 0.18)', fontSize: 11, marginLeft: 8 }} className="hidden lg:block">
        Drag handles to connect · Delete to remove
      </span>
    </div>
  )
}

function ToolBtn({ onClick, icon, label, glow }: {
  onClick: () => void
  icon: React.ReactNode
  label: string
  glow: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
        background: `${glow}18`,
        border: `1px solid ${glow}44`,
        color: '#cbd5e1',
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
        el.style.background = `${glow}18`
        el.style.borderColor = `${glow}44`
        el.style.color = '#cbd5e1'
      }}
    >
      {icon}{label}
    </button>
  )
}
