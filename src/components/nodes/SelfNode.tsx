import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { SelfData, SelfNode } from '../../types'

const handleStyle = {
  width: 8, height: 8,
  background: 'rgba(255,249,200,0.5)',
  border: '1px solid rgba(255,249,200,0.8)',
  borderRadius: '50%',
}

const COLOR  = '#fffef0'
const GLOW   = '#ffe87a'
const R      = 22    // core radius px
const SPIKE  = 58    // cross spike half-length px
const DIAG   = 34    // diagonal spike half-length px

export function SelfNodeComponent({ data, selected }: NodeProps<SelfNode>) {
  const d = data as unknown as SelfData

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Handle type="source" position={Position.Top}    style={handleStyle} />
      <Handle type="source" position={Position.Left}   style={handleStyle} />
      <Handle type="source" position={Position.Bottom} style={handleStyle} />
      <Handle type="source" position={Position.Right}  style={handleStyle} />

      <svg
        width={R * 2} height={R * 2}
        viewBox={`${-R} ${-R} ${R * 2} ${R * 2}`}
        overflow="visible"
        style={{
          filter: [
            `drop-shadow(0 0 10px ${GLOW})`,
            `drop-shadow(0 0 24px ${GLOW}99)`,
            selected ? `drop-shadow(0 0 40px ${GLOW}bb)` : '',
          ].filter(Boolean).join(' '),
          animation: 'starPulse 4s ease-in-out infinite',
        }}
      >
        {/* Concentric halos */}
        <circle cx={0} cy={0} r={R * 3.2} fill={COLOR} opacity={0.04} />
        <circle cx={0} cy={0} r={R * 2.1} fill={COLOR} opacity={0.08} />
        <circle cx={0} cy={0} r={R * 1.45} fill={COLOR} opacity={0.15} />
        {/* Core */}
        <circle cx={0} cy={0} r={R} fill={COLOR} />
        {/* Cross diffraction spikes */}
        <line x1={-SPIKE} y1={0} x2={SPIKE} y2={0}
          stroke={COLOR} strokeWidth={1.3} opacity={0.6} strokeLinecap="round" />
        <line x1={0} y1={-SPIKE} x2={0} y2={SPIKE}
          stroke={COLOR} strokeWidth={1.3} opacity={0.6} strokeLinecap="round" />
        {/* Diagonal diffraction spikes */}
        <line
          x1={-DIAG * 0.707} y1={-DIAG * 0.707}
          x2={ DIAG * 0.707} y2={ DIAG * 0.707}
          stroke={COLOR} strokeWidth={0.7} opacity={0.32} strokeLinecap="round" />
        <line
          x1={ DIAG * 0.707} y1={-DIAG * 0.707}
          x2={-DIAG * 0.707} y2={ DIAG * 0.707}
          stroke={COLOR} strokeWidth={0.7} opacity={0.32} strokeLinecap="round" />
      </svg>

      <div style={{
        marginTop: 12,
        background: 'rgba(2, 4, 9, 0.82)',
        border: `1px solid ${selected ? 'rgba(255,249,200,0.45)' : 'rgba(255,249,200,0.18)'}`,
        borderRadius: 8,
        padding: '5px 14px',
        textAlign: 'center',
        backdropFilter: 'blur(6px)',
        transition: 'border-color 0.2s',
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
          color: 'rgba(255,249,200,0.5)', textTransform: 'uppercase', marginBottom: 2,
        }}>
          You
        </div>
        <div style={{ color: COLOR, fontSize: 13, fontWeight: 700 }}>
          {d.name || 'You'}
        </div>
      </div>
    </div>
  )
}
