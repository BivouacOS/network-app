import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { PersonData, PersonNode } from '../../types'
import { getFollowUpStatus, formatDate, computeNextFollowUp } from '../../utils/dateHelpers'

const STATUS_GLOW: Record<string, { core: string; glow: string; ring: string }> = {
  overdue: { core: '#fca5a5', glow: '#ef4444', ring: '#ef444466' },
  soon:    { core: '#fde68a', glow: '#f59e0b', ring: '#f59e0b66' },
  ok:      { core: '#a5f3fc', glow: '#06b6d4', ring: '#06b6d466' },
  none:    { core: '#bfdbfe', glow: '#93c5fd', ring: '#93c5fd44' },
}

export function PersonNodeComponent({ data, selected }: NodeProps<PersonNode>) {
  const d = data as unknown as PersonData

  const effectiveNextFollowUp = d.followUpMode && d.connectedDate
    ? computeNextFollowUp(d.connectedDate, d.lastContact, d.followUpMode, d.customIntervalDays ?? 30)
    : d.nextFollowUp

  const status = getFollowUpStatus(effectiveNextFollowUp)
  const colors = STATUS_GLOW[status]
  const needsCustom = d.followUpMode === 'auto' && d.connectedDate && !effectiveNextFollowUp

  const glowSize = selected ? '0 0 10px 4px' : '0 0 6px 2px'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 120 }}>
      <Handle type="target" position={Position.Top} style={{ top: 6 }} />
      <Handle type="target" position={Position.Left} style={{ left: 6 }} />
      <Handle type="source" position={Position.Bottom} style={{ bottom: 6 }} />
      <Handle type="source" position={Position.Right} style={{ right: 6 }} />

      {/* Star core */}
      <div style={{
        width: selected ? 14 : 10,
        height: selected ? 14 : 10,
        borderRadius: '50%',
        background: colors.core,
        boxShadow: [
          `${glowSize} ${colors.glow}`,
          `0 0 20px 8px ${colors.glow}33`,
          selected ? `0 0 30px 14px ${colors.glow}22` : '',
        ].filter(Boolean).join(', '),
        transition: 'all 0.2s ease',
        animation: 'starPulse 3s ease-in-out infinite',
        flexShrink: 0,
      }} />

      {/* Label card */}
      <div style={{
        marginTop: 8,
        background: 'rgba(2, 4, 9, 0.72)',
        border: `1px solid ${selected ? colors.glow + '88' : 'rgba(147, 197, 253, 0.1)'}`,
        borderRadius: 8,
        padding: '6px 10px',
        textAlign: 'center',
        backdropFilter: 'blur(6px)',
        transition: 'border-color 0.2s',
        minWidth: 110,
      }}>
        <div style={{ color: '#f1f5f9', fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>{d.name}</div>

        {d.company && (
          <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{d.company}</div>
        )}

        {effectiveNextFollowUp && (
          <div style={{
            marginTop: 5,
            fontSize: 10,
            padding: '2px 7px',
            borderRadius: 10,
            display: 'inline-block',
            background: colors.ring,
            color: colors.core,
            border: `1px solid ${colors.glow}44`,
          }}>
            {status === 'overdue' ? '⚠' : status === 'soon' ? '⏰' : '✦'}{' '}
            {formatDate(effectiveNextFollowUp)}
          </div>
        )}

        {needsCustom && (
          <div style={{
            marginTop: 5, fontSize: 10, padding: '2px 7px', borderRadius: 10,
            display: 'inline-block',
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#fbbf24',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}>
            ⚡ set schedule
          </div>
        )}
      </div>
    </div>
  )
}
