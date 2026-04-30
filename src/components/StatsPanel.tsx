import { useMemo } from 'react'
import { BarChart2, Building2, MapPin, X } from 'lucide-react'
import type { AppNode, PersonData } from '../types'

export interface ActiveFilter {
  type: 'company' | 'location'
  value: string
}

interface Props {
  nodes: AppNode[]
  activeFilter: ActiveFilter | null
  onFilter: (f: ActiveFilter | null) => void
}

function tally(nodes: AppNode[], key: 'company' | 'location'): [string, number][] {
  const counts: Record<string, number> = {}
  for (const n of nodes) {
    if (n.type !== 'person') continue
    const d = n.data as unknown as PersonData
    const val = (d[key] ?? '').trim()
    if (!val) continue
    counts[val] = (counts[val] ?? 0) + 1
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])
}

export function StatsPanel({ nodes, activeFilter, onFilter }: Props) {
  const companies = useMemo(() => tally(nodes, 'company'), [nodes])
  const locations = useMemo(() => tally(nodes, 'location'), [nodes])
  const personCount = nodes.filter(n => n.type === 'person').length

  const maxCompany = companies[0]?.[1] ?? 1
  const maxLocation = locations[0]?.[1] ?? 1

  function toggle(type: 'company' | 'location', value: string) {
    if (activeFilter?.type === type && activeFilter.value === value) {
      onFilter(null)
    } else {
      onFilter({ type, value })
    }
  }

  return (
    <div style={{
      width: 220,
      flexShrink: 0,
      background: '#0d1117',
      borderRight: '1px solid #1e293b',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <BarChart2 size={15} color="#3b82f6" />
        <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}>
          NETWORK STATS
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
        {personCount === 0 ? (
          <p style={{ color: '#334155', fontSize: 12, textAlign: 'center', padding: '20px 14px' }}>
            No contacts yet
          </p>
        ) : (
          <>
            {/* Company section */}
            {companies.length > 0 && (
              <Section
                icon={<Building2 size={12} />}
                label="Company"
                items={companies}
                max={maxCompany}
                filterType="company"
                activeFilter={activeFilter}
                onToggle={toggle}
              />
            )}

            {/* Location section */}
            {locations.length > 0 && (
              <Section
                icon={<MapPin size={12} />}
                label="Location"
                items={locations}
                max={maxLocation}
                filterType="location"
                activeFilter={activeFilter}
                onToggle={toggle}
              />
            )}
          </>
        )}
      </div>

      {activeFilter && (
        <button
          onClick={() => onFilter(null)}
          style={{
            margin: '8px 10px',
            padding: '6px 10px',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 8,
            color: '#94a3b8',
            fontSize: 11,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <X size={11} /> Clear filter
        </button>
      )}
    </div>
  )
}

interface SectionProps {
  icon: React.ReactNode
  label: string
  items: [string, number][]
  max: number
  filterType: 'company' | 'location'
  activeFilter: ActiveFilter | null
  onToggle: (type: 'company' | 'location', value: string) => void
}

function Section({ icon, label, items, max, filterType, activeFilter, onToggle }: SectionProps) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 14px 4px',
        color: '#475569',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}>
        {icon} {label}
      </div>

      {items.map(([value, count]) => {
        const isActive = activeFilter?.type === filterType && activeFilter.value === value
        const barPct = Math.round((count / max) * 100)

        return (
          <button
            key={value}
            onClick={() => onToggle(filterType, value)}
            style={{
              width: '100%',
              padding: '5px 14px',
              background: isActive ? '#1e3a5f' : 'transparent',
              border: 'none',
              borderLeft: isActive ? '2px solid #3b82f6' : '2px solid transparent',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                color: isActive ? '#93c5fd' : '#cbd5e1',
                fontSize: 12,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 150,
              }}>
                {value}
              </span>
              <span style={{
                color: isActive ? '#60a5fa' : '#475569',
                fontSize: 11,
                fontWeight: 600,
                marginLeft: 6,
                flexShrink: 0,
              }}>
                {count}
              </span>
            </div>
            <div style={{ height: 3, background: '#1e293b', borderRadius: 2 }}>
              <div style={{
                height: '100%',
                width: `${barPct}%`,
                background: isActive ? '#3b82f6' : '#334155',
                borderRadius: 2,
                transition: 'width 0.2s',
              }} />
            </div>
          </button>
        )
      })}
    </div>
  )
}
