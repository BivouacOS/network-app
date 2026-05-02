import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useId } from 'react'
import type { JobData, JobNode } from '../../types'
import { formatDate } from '../../utils/dateHelpers'

const handleStyle = {
  width: 8, height: 8,
  background: 'rgba(147,197,253,0.5)',
  border: '1px solid rgba(147,197,253,0.8)',
  borderRadius: '50%',
}

const JOB_CONFIG: Record<string, { label: string; glow: string; text: string }> = {
  recommendation: { label: 'Referral',  glow: '#b45309', text: '#fbbf24' },
  application:    { label: 'Applied',   glow: '#1d4ed8', text: '#60a5fa' },
  interview:      { label: 'Interview', glow: '#6b21a8', text: '#c084fc' },
  dead_end:       { label: 'Dead End',  glow: '#991b1b', text: '#f87171' },
}

// ── Saturn — Referral ──────────────────────────────────────────────────
function SaturnIcon({ s, uid }: { s: number; uid: string }) {
  const r  = s * 0.38
  const rx = s * 0.72, ry = s * 0.22, oy = s * 0.06
  const clip = `sc${uid}`
  return (
    <svg width={s * 1.8} height={s}
      viewBox={`${-s * 0.9} ${-s / 2} ${s * 1.8} ${s}`}
      overflow="visible"
      style={{ filter: 'drop-shadow(0 0 1px #b45309)' }}>
      <defs>
        <clipPath id={clip}><circle cx={0} cy={0} r={r} /></clipPath>
      </defs>
      {/* Ring — back half */}
      <path d={`M${-rx} ${oy} A${rx} ${ry} 0 0 1 ${rx} ${oy}`}
        fill="none" stroke="#92400e" strokeWidth="3" strokeLinecap="round" />
      {/* Planet base */}
      <circle cx={0} cy={0} r={r} fill="#92400e" />
      {/* Cell shadow — hard-edge offset circle, clipped to planet */}
      <circle cx={r * 0.38} cy={r * 0.22} r={r * 0.82}
        fill="#78350f" clipPath={`url(#${clip})`} />
      {/* Ring — front half */}
      <path d={`M${-rx} ${oy} A${rx} ${ry} 0 0 0 ${rx} ${oy}`}
        fill="none" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// ── Exoplanet — Applied ────────────────────────────────────────────────
function ExoplanetIcon({ s, uid }: { s: number; uid: string }) {
  const r = s * 0.44
  const clip = `ec${uid}`
  return (
    <svg width={s} height={s}
      viewBox={`${-s / 2} ${-s / 2} ${s} ${s}`}
      overflow="visible"
      style={{ filter: 'drop-shadow(0 0 1px #1d4ed8)' }}>
      <defs>
        <clipPath id={clip}><circle cx={0} cy={0} r={r} /></clipPath>
      </defs>
      {/* Planet base */}
      <circle cx={0} cy={0} r={r} fill="#1d4ed8" />
      {/* Cell shadow */}
      <circle cx={r * 0.36} cy={r * 0.2} r={r * 0.82}
        fill="#1e3a8a" clipPath={`url(#${clip})`} />
      {/* Flat surface detail — two short terrain arcs */}
      <path d={`M${-r * 0.55} ${-r * 0.08} Q0 ${-r * 0.35} ${r * 0.55} ${-r * 0.08}`}
        fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round"
        clipPath={`url(#${clip})`} />
      <path d={`M${-r * 0.3} ${r * 0.22} Q${r * 0.1} ${r * 0.4} ${r * 0.45} ${r * 0.18}`}
        fill="none" stroke="#1e40af" strokeWidth="1.5" strokeLinecap="round"
        clipPath={`url(#${clip})`} />
    </svg>
  )
}

// ── Pulsar / Neutron Star — Interview ─────────────────────────────────
function PulsarIcon({ s, uid }: { s: number; uid: string }) {
  const r = s * 0.34
  const clip = `pc${uid}`
  return (
    <svg width={s} height={s}
      viewBox={`${-s / 2} ${-s / 2} ${s} ${s}`}
      overflow="visible"
      style={{ filter: 'drop-shadow(0 0 1px #6b21a8)' }}>
      <defs>
        <clipPath id={clip}><circle cx={0} cy={0} r={r} /></clipPath>
      </defs>
      {/* Flat emission rings — clean strokes, no blur */}
      <circle cx={0} cy={0} r={r * 2.1} fill="none" stroke="#581c87" strokeWidth="1.5" />
      <circle cx={0} cy={0} r={r * 1.6} fill="none" stroke="#7e22ce" strokeWidth="1.5" />
      <circle cx={0} cy={0} r={r * 1.22} fill="none" stroke="#a855f7" strokeWidth="1.5" />
      {/* Planet base */}
      <circle cx={0} cy={0} r={r} fill="#5b21b6" />
      {/* Cell shadow */}
      <circle cx={r * 0.38} cy={r * 0.22} r={r * 0.82}
        fill="#3b0764" clipPath={`url(#${clip})`} />
    </svg>
  )
}

// ── Black Hole — Dead End ─────────────────────────────────────────────
function BlackHoleIcon({ s, uid }: { s: number; uid: string }) {
  const r   = s * 0.34
  const drx = s * 0.78, dry = s * 0.24
  return (
    <svg width={s * 1.8} height={s}
      viewBox={`${-s * 0.9} ${-s / 2} ${s * 1.8} ${s}`}
      overflow="visible"
      style={{ filter: 'drop-shadow(0 0 1px #991b1b)' }}>
      {/* Accretion disk — back half (dim) */}
      <path d={`M${-drx} 0 A${drx} ${dry} 0 0 1 ${drx} 0`}
        fill="none" stroke="#7f1d1d" strokeWidth="5" strokeLinecap="round" />
      {/* Photon ring */}
      <circle cx={0} cy={0} r={r + 3.5} fill="none" stroke="#f97316" strokeWidth="1.5" />
      {/* Event horizon — flat black */}
      <circle cx={0} cy={0} r={r} fill="#080808" />
      {/* Event horizon edge highlight */}
      <circle cx={0} cy={0} r={r} fill="none" stroke="#1a0000" strokeWidth="1" />
      {/* Accretion disk — front half (bright) */}
      <path d={`M${-drx} 0 A${drx} ${dry} 0 0 0 ${drx} 0`}
        fill="none" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
    </svg>
  )
}

// ── Main node component ───────────────────────────────────────────────
export function JobNodeComponent({ data, selected }: NodeProps<JobNode>) {
  const d   = data as unknown as JobData
  const cfg = JOB_CONFIG[d.jobType] ?? JOB_CONFIG.recommendation
  const uid = useId().replace(/:/g, '')

  const edgeCount = (data as unknown as { edgeCount?: number }).edgeCount ?? 0
  const s = 44 + Math.min(18, Math.log1p(edgeCount) * 6)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 120 }}>
      <Handle type="source" position={Position.Top}    style={handleStyle} />
      <Handle type="source" position={Position.Left}   style={handleStyle} />
      <Handle type="source" position={Position.Bottom} style={handleStyle} />
      <Handle type="source" position={Position.Right}  style={handleStyle} />

      {d.jobType === 'recommendation' && <SaturnIcon    s={s} uid={uid} />}
      {d.jobType === 'application'    && <ExoplanetIcon s={s} uid={uid} />}
      {d.jobType === 'interview'      && <PulsarIcon    s={s} uid={uid} />}
      {d.jobType === 'dead_end'       && <BlackHoleIcon s={s} uid={uid} />}

      <div style={{
        marginTop: 10,
        background: 'rgba(2, 4, 9, 0.72)',
        border: `1px solid ${selected ? cfg.glow + '88' : 'rgba(147, 197, 253, 0.1)'}`,
        borderRadius: 8,
        padding: '6px 10px',
        textAlign: 'center',
        backdropFilter: 'blur(6px)',
        minWidth: 110,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
          color: cfg.text, marginBottom: 3, textTransform: 'uppercase',
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
