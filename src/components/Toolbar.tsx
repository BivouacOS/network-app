import { UserPlus, Briefcase, Upload, Network } from 'lucide-react'

interface Props {
  onAddPerson: () => void
  onAddJob: () => void
  onImport: () => void
  nodeCount: number
  edgeCount: number
}

export function Toolbar({ onAddPerson, onAddJob, onImport, nodeCount, edgeCount }: Props) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-900 border-b border-slate-700 z-10 flex-shrink-0">
      <div className="flex items-center gap-2 mr-2">
        <Network size={18} className="text-blue-400" />
        <span className="text-white font-semibold text-sm">Network</span>
        <span className="text-slate-500 text-xs ml-1">{nodeCount} nodes · {edgeCount} connections</span>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <ToolBtn onClick={onAddPerson} icon={<UserPlus size={14} />} label="Add Contact" color="blue" />
        <ToolBtn onClick={onAddJob} icon={<Briefcase size={14} />} label="Add Job" color="purple" />
        <ToolBtn onClick={onImport} icon={<Upload size={14} />} label="Import CSV" color="slate" />
      </div>

      <div className="text-xs text-slate-600 ml-2 hidden lg:block">
        Drag handles to connect · Click edge + Delete to remove
      </div>
    </div>
  )
}

function ToolBtn({ onClick, icon, label, color }: {
  onClick: () => void
  icon: React.ReactNode
  label: string
  color: 'blue' | 'purple' | 'slate'
}) {
  const colors = {
    blue:   'bg-blue-600 hover:bg-blue-500 text-white',
    purple: 'bg-purple-700 hover:bg-purple-600 text-white',
    slate:  'bg-slate-700 hover:bg-slate-600 text-slate-200',
  }
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${colors[color]}`}>
      {icon}{label}
    </button>
  )
}
