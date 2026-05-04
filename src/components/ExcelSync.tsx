import { FileSpreadsheet, Link2, Link2Off } from 'lucide-react'
import type { ExcelSyncStatus } from '../services/excelSync'

interface Props {
  status: ExcelSyncStatus
  fileName?: string
  onLink: () => void
  onUnlink: () => void
}

export function ExcelSync({ status, fileName, onLink, onUnlink }: Props) {
  if (status === 'unlinked') {
    return (
      <button
        onClick={onLink}
        title="Link your Excel file for automatic sync"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
          background: 'rgba(71,85,105,0.18)',
          border: '1px solid rgba(71,85,105,0.44)',
          color: '#94a3b8', cursor: 'pointer',
        }}
        onMouseEnter={e => { const el = e.currentTarget; el.style.background = 'rgba(71,85,105,0.3)'; el.style.color = '#f1f5f9' }}
        onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'rgba(71,85,105,0.18)'; el.style.color = '#94a3b8' }}
      >
        <Link2 size={13} />Link Excel
      </button>
    )
  }

  if (status === 'needs-permission') {
    return (
      <button
        onClick={onLink}
        title="Click to reconnect Excel sync"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
          background: 'rgba(234,179,8,0.12)',
          border: '1px solid rgba(234,179,8,0.4)',
          color: '#fde047', cursor: 'pointer',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(234,179,8,0.22)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(234,179,8,0.12)' }}
      >
        <FileSpreadsheet size={13} />Reconnect Excel
      </button>
    )
  }

  const isError = status === 'error'
  const isSyncing = status === 'syncing'
  const color = isError ? '#f87171' : '#86efac'
  const borderColor = isError ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.25)'
  const bg = isError ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.08)'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '5px 10px', borderRadius: 8, fontSize: 12,
        background: bg, border: `1px solid ${borderColor}`, color,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: isSyncing ? '#facc15' : color,
          flexShrink: 0,
          animation: isSyncing ? 'pulse 1s infinite' : undefined,
        }} />
        <FileSpreadsheet size={12} />
        <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {isError ? 'Sync error' : isSyncing ? 'Syncing…' : (fileName ?? 'Excel linked')}
        </span>
      </div>
      <button
        onClick={onUnlink}
        title="Unlink Excel file"
        style={{
          display: 'flex', alignItems: 'center',
          padding: '5px 6px', borderRadius: 8,
          background: 'transparent', border: '1px solid rgba(71,85,105,0.3)',
          color: '#64748b', cursor: 'pointer',
        }}
        onMouseEnter={e => { const el = e.currentTarget; el.style.color = '#f87171'; el.style.borderColor = 'rgba(239,68,68,0.4)' }}
        onMouseLeave={e => { const el = e.currentTarget; el.style.color = '#64748b'; el.style.borderColor = 'rgba(71,85,105,0.3)' }}
      >
        <Link2Off size={11} />
      </button>
    </div>
  )
}
