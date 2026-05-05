import { FileSpreadsheet, Link2 } from 'lucide-react'
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
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 3, width: 48, padding: '6px 4px', borderRadius: 8,
          background: 'rgba(71,85,105,0.18)', border: '1px solid rgba(71,85,105,0.44)',
          color: '#94a3b8', cursor: 'pointer', transition: 'all 0.15s',
          fontSize: 10, fontWeight: 500,
        }}
        onMouseEnter={e => { const el = e.currentTarget; el.style.background = 'rgba(71,85,105,0.3)'; el.style.color = '#f1f5f9' }}
        onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'rgba(71,85,105,0.18)'; el.style.color = '#94a3b8' }}
      >
        <Link2 size={19} />
        <span style={{ lineHeight: 1 }}>Excel</span>
      </button>
    )
  }

  if (status === 'needs-permission') {
    return (
      <button
        onClick={onLink}
        title="Click to reconnect Excel sync"
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 3, width: 48, padding: '6px 4px', borderRadius: 8,
          background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.4)',
          color: '#fde047', cursor: 'pointer', transition: 'all 0.15s',
          fontSize: 10, fontWeight: 500,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(234,179,8,0.22)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(234,179,8,0.12)' }}
      >
        <FileSpreadsheet size={19} />
        <span style={{ lineHeight: 1 }}>Excel</span>
      </button>
    )
  }

  const isError = status === 'error'
  const isSyncing = status === 'syncing'
  const color = isError ? '#f87171' : '#86efac'
  const borderColor = isError ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.25)'
  const bg = isError ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.08)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 3, width: 48, padding: '6px 4px', borderRadius: 8,
        background: bg, border: `1px solid ${borderColor}`, color,
        fontSize: 10, fontWeight: 500, position: 'relative',
      }}>
        <span style={{
          position: 'absolute', top: 4, right: 4,
          width: 5, height: 5, borderRadius: '50%',
          background: isSyncing ? '#facc15' : color,
          animation: isSyncing ? 'pulse 1s infinite' : undefined,
        }} />
        <FileSpreadsheet size={19} />
        <span style={{ lineHeight: 1 }}>{isError ? 'Error' : isSyncing ? 'Syncing' : 'Excel'}</span>
      </div>
      <button
        onClick={onUnlink}
        title="Unlink Excel file"
        style={{
          background: 'none', border: 'none', color: '#334155', cursor: 'pointer',
          fontSize: 9, padding: '1px 0', lineHeight: 1,
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#f87171' }}
        onMouseLeave={e => { e.currentTarget.style.color = '#334155' }}
      >
        unlink
      </button>
    </div>
  )
}
