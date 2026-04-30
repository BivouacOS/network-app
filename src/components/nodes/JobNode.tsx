import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Briefcase } from 'lucide-react'
import type { JobData, JobNode } from '../../types'
import { formatDate } from '../../utils/dateHelpers'

const jobTypeConfig = {
  recommendation: { label: 'Referral',  color: '#3b82f6', bg: '#0c1f3f' },
  application:    { label: 'Applied',   color: '#f97316', bg: '#2a1200' },
  interview:      { label: 'Interview', color: '#a855f7', bg: '#1e0a2e' },
}

export function JobNodeComponent({ data, selected }: NodeProps<JobNode>) {
  const d = data as unknown as JobData
  const cfg = jobTypeConfig[d.jobType] ?? jobTypeConfig.recommendation

  return (
    <div
      style={{
        border: `2px solid ${selected ? '#3b82f6' : cfg.color}`,
        background: cfg.bg,
        minWidth: 180,
      }}
      className="rounded-xl px-4 py-3 shadow-lg"
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} />

      <div className="flex items-center gap-2 mb-1">
        <Briefcase size={14} style={{ color: cfg.color }} />
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${cfg.color}22`, color: cfg.color, border: `1px solid ${cfg.color}44` }}
        >
          {cfg.label}
        </span>
      </div>

      <div className="font-semibold text-white text-sm leading-tight">{d.title}</div>
      {d.company && <div className="text-slate-400 text-xs mt-0.5">{d.company}</div>}
      {d.date && <div className="text-slate-500 text-xs mt-1">{formatDate(d.date)}</div>}
    </div>
  )
}
