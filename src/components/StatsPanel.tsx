import { useMemo } from 'react'
import { BarChart2, Building2, MapPin, Heart, X } from 'lucide-react'
import type { AppNode, PersonData } from '../types'

export interface ActiveFilter {
  type: 'company' | 'location' | 'relationship'
  value: string
}

interface Props {
  nodes: AppNode[]
  activeFilter: ActiveFilter | null
  onFilter: (f: ActiveFilter | null) => void
}

function tally(nodes: AppNode[], key: 'company' | 'location' | 'relationship'): [string, number][] {
  const counts: Record<string, number> = {}
  for (const n of nodes) {
    if (n.type !== 'person') continue
    const d = n.data as unknown as PersonData
    const cat = d.contactCategory || 'professional'
    if (key === 'company' && cat === 'personal') continue
    if (key === 'relationship' && cat !== 'personal') continue
    const val = (d[key] ?? '').trim()
    if (!val) continue
    counts[val] = (counts[val] ?? 0) + 1
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])
}

export function StatsPanel({ nodes, activeFilter, onFilter }: Props) {
  const companies = useMemo(() => tally(nodes, 'company'), [nodes])
  const relationships = useMemo(() => tally(nodes, 'relationship'), [nodes])
  const locations = useMemo(() => tally(nodes, 'location'), [nodes])
  const personCount = nodes.filter(n => n.type === 'person').length

  const maxCompany = companies[0]?.[1] ?? 1
  const maxRelationship = relationships[0]?.[1] ?? 1
  const maxLocation = locations[0]?.[1] ?? 1

  function toggle(type: 'company' | 'location' | 'relationship', value: string) {
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
      background: 'rgba(2, 4, 9, 0.78)',
      borderRight: '1px solid rgba(147, 197, 253, 0.1)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid rgba(147, 197, 253, 0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <BarChart2 size={15} color="rgba(147, 197, 253, 0.6)" />
        <span style={{ color: 'rgba(147, 197, 253, 0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>
          STAR MAP
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
        {personCount === 0 ? (
          <p style={{ color: 'rgba(147, 197, 253, 0.15)', fontSize: 12, textAlign: 'center', padding: '20px 14px' }}>
            No stars charted
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

            {/* Relationship section */}
            {relationships.length > 0 && (
              <Section
                icon={<Heart size={12} />}
                label="Relationship"
                items={relationships}
                max={maxRelationship}
                filterType="relationship"
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
            background: 'rgba(147, 197, 253, 0.06)',
            border: '1px solid rgba(147, 197, 253, 0.15)',
            borderRadius: 8,
            color: 'rgba(147, 197, 253, 0.5)',
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
  filterType: 'company' | 'location' | 'relationship'
  activeFilter: ActiveFilter | null
  onToggle: (type: 'company' | 'location' | 'relationship', value: string) => void
}

function Section({ icon, label, items, max, filterType, activeFilter, onToggle }: SectionProps) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 14px 4px',
        color: 'rgba(241, 245, 249, 0.85)',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.08em',
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
              background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              border: 'none',
              borderLeft: isActive ? '2px solid rgba(147, 197, 253, 0.6)' : '2px solid transparent',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                color: isActive ? '#bfdbfe' : 'rgba(241, 245, 249, 0.9)',
                fontSize: 12,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 150,
              }}>
                {value}
              </span>
              <span style={{
                color: isActive ? '#93c5fd' : 'rgba(148, 163, 184, 0.9)',
                fontSize: 11,
                fontWeight: 600,
                marginLeft: 6,
                flexShrink: 0,
              }}>
                {count}
              </span>
            </div>
            <div style={{ height: 2, background: 'rgba(147, 197, 253, 0.15)', borderRadius: 2 }}>
              <div style={{
                height: '100%',
                width: `${barPct}%`,
                background: isActive ? 'rgba(147, 197, 253, 0.4)' : 'rgba(147, 197, 253, 0.35)',
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
