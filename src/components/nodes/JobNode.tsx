import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { JobData, JobNode } from '../../types'
import { formatDate } from '../../utils/dateHelpers'

const JOB_COLORS = {
  recommendation: { core: '#93c5fd', glow: '#3b82f6', label: 'Referral' },
  application:    { core: '#fdba74', glow: '#f97316', label: 'Applied' },
  interview:      { core: '#d8b4fe', glow: '#a855f7', label: 'Interview' },
}

export function JobNodeComponent({ data, selected }: NodeProps<JobNode>) {
  const d = data as unknown as JobData
  const cfg = JOB_COLORS[d.jobType] ?? JOB_COLORS.recommendation

  const glowSize = selected ? '0 0 10px 4px' : '0 0 6px 2px'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 120 }}>
      <Handle type="target" position={Position.Top} style={{ top: 6 }} />
      <Handle type="target" position={Position.Left} style={{ left: 6 }} />
      <Handle type="source" position={Position.Bottom} style={{ bottom: 6 }} />
      <Handle type="source" position={Position.Right} style={{ right: 6 }} />

      {/* Diamond star shape */}
      <div style={{
        width: selected ? 12 : 9,
        height: selected ? 12 : 9,
        background: cfg.core,
        transform: 'rotate(45deg)',
        boxShadow: [
          `${glowSize} ${cfg.glow}`,
          `0 0 18px 7px ${cfg.glow}33`,
          selected ? `0 0 28px 12px ${cfg.glow}22` : '',
        ].filter(Boolean).join(', '),
        transition: 'all 0.2s ease',
        animation: 'starPulse 4s ease-in-out infinite',
        flexShrink: 0,
      }} />

      {/* Label card */}
      <div style={{
        marginTop: 10,
        background: 'rgba(2, 4, 9, 0.72)',
        border: `1px solid ${selected ? cfg.glow + '88' : 'rgba(147, 197, 253, 0.1)'}`,
        borderRadius: 8,
        padding: '6px 10px',
        textAlign: 'center',
        backdropFilter: 'blur(6px)',
        transition: 'border-color 0.2s',
        minWidth: 110,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
          color: cfg.glow, marginBottom: 3,
          textTransform: 'uppercase',
        }}>
          {cfg.label}
        </div>
        <div style={{ color: '#f1f5f9', fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>{d.title}</div>
        {d.company && <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{d.company}</div>}
        {d.date && <div style={{ color: '#475569', fontSize: 10, marginTop: 3 }}>{formatDate(d.date)}</div>}
      </div>
    </div>
  )
}
