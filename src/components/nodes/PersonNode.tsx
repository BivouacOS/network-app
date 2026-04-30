import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Link2, Mail, Phone, Building2, Contact, MapPin } from 'lucide-react'
import type { PersonData, PersonNode } from '../../types'
import { getFollowUpStatus, formatDate, statusColors } from '../../utils/dateHelpers'

const contactIcon = {
  linkedin: <Link2 size={12} />,
  email: <Mail size={12} />,
  phone: <Phone size={12} />,
  other: <Contact size={12} />,
}

export function PersonNodeComponent({ data, selected }: NodeProps<PersonNode>) {
  const d = data as unknown as PersonData
  const status = getFollowUpStatus(d.nextFollowUp)
  const colors = statusColors(status)

  return (
    <div
      style={{
        border: `2px solid ${selected ? '#3b82f6' : colors.border}`,
        background: colors.bg,
        minWidth: 200,
      }}
      className="rounded-xl px-4 py-3 shadow-lg"
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} />

      <div className="font-semibold text-white text-sm leading-tight">{d.name}</div>

      {d.company && (
        <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
          <Building2 size={11} />
          <span>{d.company}</span>
        </div>
      )}

      <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
        {contactIcon[d.contactMethod] ?? <Link2 size={12} />}
        <span className="truncate max-w-36">{d.contactValue || '—'}</span>
      </div>

      {d.location && (
        <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
          <MapPin size={11} />
          <span>{d.location}</span>
        </div>
      )}

      {d.nextFollowUp && (
        <div
          className="mt-2 text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1"
          style={{ background: `${colors.border}22`, color: colors.border, border: `1px solid ${colors.border}44` }}
        >
          {status === 'overdue' ? '⚠ Overdue' : status === 'soon' ? '⏰ Due soon' : '✓ Follow up'}
          {' '}{formatDate(d.nextFollowUp)}
        </div>
      )}
    </div>
  )
}
