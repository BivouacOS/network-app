import { useMemo, useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
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

const SCROLL_STYLE = `
  .statspanel-scroll::-webkit-scrollbar {
    width: 10px;
  }
  .statspanel-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .statspanel-scroll::-webkit-scrollbar-thumb {
    background-color: transparent;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='28' viewBox='0 0 10 28'%3E%3Cpath d='M5 1 C5 1 9 8 9 15 C9 19.5 7.2 22 5 22 C2.8 22 1 19.5 1 15 C1 8 5 1 5 1Z' fill='rgba(147%2C197%2C253%2C0.6)' stroke='rgba(147%2C197%2C253%2C0.8)' stroke-width='0.5'/%3E%3Ccircle cx='5' cy='14' r='1.5' fill='rgba(96%2C165%2C250%2C0.7)'/%3E%3Cpath d='M1.5 17 L0 22 L3 20Z' fill='rgba(147%2C197%2C253%2C0.35)'/%3E%3Cpath d='M8.5 17 L10 22 L7 20Z' fill='rgba(147%2C197%2C253%2C0.35)'/%3E%3Cpath d='M3.5 22 L2.5 27 L5 25 L7.5 27 L6.5 22Z' fill='rgba(251%2C191%2C36%2C0.6)'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-size: 10px 28px;
    background-position: center top;
    border-radius: 5px;
  }
`

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
  const [windowWidth, setWindowWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1200)
  const [openSection, setOpenSection] = useState<'company' | 'location' | 'relationship' | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    if (!openSection) return
    function handleClick(e: MouseEvent) {
      if (
        overlayRef.current && !overlayRef.current.contains(e.target as Node) &&
        stripRef.current && !stripRef.current.contains(e.target as Node)
      ) {
        setOpenSection(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [openSection])

  const isNarrow = windowWidth < 1100

  useEffect(() => {
    if (!isNarrow) setOpenSection(null)
  }, [isNarrow])

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

  if (isNarrow) {
    const iconButtons: { key: 'company' | 'location' | 'relationship'; icon: ReactNode; hasData: boolean }[] = [
      { key: 'company', icon: <Building2 size={16} />, hasData: companies.length > 0 },
      { key: 'relationship', icon: <Heart size={16} />, hasData: relationships.length > 0 },
      { key: 'location', icon: <MapPin size={16} />, hasData: locations.length > 0 },
    ]

    return (
      <div style={{ display: 'flex', position: 'relative', flexShrink: 0 }}>
        {/* Icon strip */}
        <div
          ref={stripRef}
          style={{
            width: 44,
            flexShrink: 0,
            background: 'rgba(2, 4, 9, 0.78)',
            borderRight: '1px solid rgba(147, 197, 253, 0.1)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: 10,
            gap: 4,
          }}
        >
          {iconButtons.map(({ key, icon, hasData }) => {
            if (!hasData) return null
            const isOpen = openSection === key
            const isFiltered = activeFilter?.type === key
            return (
              <button
                key={key}
                onClick={() => setOpenSection(isOpen ? null : key)}
                title={key.charAt(0).toUpperCase() + key.slice(1)}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isOpen ? 'rgba(59,130,246,0.15)' : 'transparent',
                  border: `1px solid ${isOpen ? 'rgba(147,197,253,0.3)' : 'transparent'}`,
                  color: isFiltered ? '#93c5fd' : 'rgba(147,197,253,0.45)',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                {icon}
                {isFiltered && (
                  <span style={{
                    position: 'absolute', top: 3, right: 3,
                    width: 5, height: 5, borderRadius: '50%',
                    background: '#3b82f6',
                  }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Floating overlay */}
        {openSection && (
          <div
            ref={overlayRef}
            style={{
              position: 'absolute', top: 0, left: 44, zIndex: 50,
              width: 220,
              background: 'rgba(2, 4, 9, 0.96)',
              border: '1px solid rgba(147, 197, 253, 0.15)',
              borderLeft: 'none',
              backdropFilter: 'blur(16px)',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 'calc(100vh - 16px)',
              overflow: 'hidden',
            }}
          >
            <div style={{
              padding: '10px 14px',
              borderBottom: '1px solid rgba(147, 197, 253, 0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ color: 'rgba(147, 197, 253, 0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>
                {openSection.toUpperCase()}
              </span>
              <button onClick={() => setOpenSection(null)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 2 }}>
                <X size={13} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {openSection === 'company' && companies.length > 0 && (
                <Section icon={<Building2 size={12} />} label="Company" items={companies} max={maxCompany} filterType="company" activeFilter={activeFilter} onToggle={toggle} />
              )}
              {openSection === 'relationship' && relationships.length > 0 && (
                <Section icon={<Heart size={12} />} label="Relationship" items={relationships} max={maxRelationship} filterType="relationship" activeFilter={activeFilter} onToggle={toggle} />
              )}
              {openSection === 'location' && locations.length > 0 && (
                <Section icon={<MapPin size={12} />} label="Location" items={locations} max={maxLocation} filterType="location" activeFilter={activeFilter} onToggle={toggle} />
              )}
            </div>
            {activeFilter?.type === openSection && (
              <button
                onClick={() => onFilter(null)}
                style={{
                  margin: '8px 10px',
                  padding: '6px 10px',
                  background: 'rgba(147, 197, 253, 0.06)',
                  border: '1px solid rgba(147, 197, 253, 0.15)',
                  borderRadius: 8,
                  color: 'rgba(147, 197, 253, 0.5)',
                  fontSize: 11, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <X size={11} /> Clear filter
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{
      width: 232,
      flexShrink: 0,
      background: 'rgba(2, 4, 9, 0.78)',
      borderRight: '1px solid rgba(147, 197, 253, 0.15)',
      borderLeft: '1px solid rgba(147, 197, 253, 0.15)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <style>{SCROLL_STYLE}</style>
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

      <div className="statspanel-scroll" style={{ flex: 1, overflowY: 'auto', padding: '10px 0', marginRight: 4 }}>
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
