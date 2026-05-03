import XLSX from 'xlsx'
import { randomUUID } from 'crypto'
import { writeFileSync } from 'fs'

const id = () => randomUUID()

// Excel serial date → YYYY-MM-DD
function excelDate(serial) {
  if (!serial || typeof serial !== 'number') return ''
  const ms = Math.round((serial - 25569) * 86400 * 1000)
  const d = new Date(ms)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

// Normalize contact method to app's ContactMethod type
function normalizeMethod(raw) {
  const v = (raw || '').toLowerCase().trim()
  if (v === 'linkedin')               return 'linkedin'
  if (v === 'email')                  return 'email'
  if (v === 'phone' || v === 'personal' || v === 'signal') return 'phone'
  return 'other'
}

// Normalize contact category
function normalizeCategory(raw, relationship) {
  const v = (raw || '').toLowerCase().trim()
  if (v === 'personal') return 'personal'
  if (v === 'professional') return 'professional'
  return relationship ? 'personal' : 'professional'
}

const wb = XLSX.readFile('network-contacts-template.xlsx')
const ws = wb.Sheets[wb.SheetNames[0]]
const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })

// Build person nodes
const personNodes = rows.map((r, i) => {
  const name = String(r.name || '').trim()
  const relationship = String(r.relationship || '').trim()
  const contactCategory = normalizeCategory(r.contact_category, relationship)
  const contactValue = typeof r.contact_value === 'number'
    ? String(r.contact_value)
    : String(r.contact_value || '').trim()

  const cols = Math.ceil(Math.sqrt(rows.length))
  const position = {
    x: 120 + (i % cols) * 280,
    y: 120 + Math.floor(i / cols) * 220,
  }

  return {
    id: id(),
    type: 'person',
    position,
    data: {
      nodeType: 'person',
      name,
      contactCategory,
      company:            String(r.company || '').trim(),
      relationship,
      contactMethod:      normalizeMethod(r.contact_method),
      contactValue,
      connectedDate:      excelDate(r.connected_date),
      lastContact:        excelDate(r.last_contact),
      nextFollowUp:       '',
      reminderNote:       String(r.reminder_note || '').trim(),
      location:           String(r.location || '').trim(),
      followUpMode:       'auto',
      customIntervalDays: 30,
      interactionCount:   0,
    },
    _linkedThrough: String(r.linked_through || '').trim(),
  }
})

// Self node — sits at center, pinned by force layout
const selfNode = {
  id: id(),
  type: 'self',
  position: { x: 0, y: 0 },
  data: { nodeType: 'self', name: 'You' },
}

// Name → node ID lookup (trimmed, lowercase for fuzzy match)
const nameIndex = new Map()
for (const n of personNodes) {
  nameIndex.set(n.data.name.toLowerCase(), n.id)
}

const FAMILY_RELATIONSHIPS = new Set(['father', 'mother', 'brother', 'sister', 'wife', 'husband', 'son', 'daughter', 'team'])

// Build edges
// - linked_through set + found → edge from introducer to this person
// - linked_through set + not found → warn, no edge created
// - linked_through empty + family relationship → edge from self to this person
// - linked_through empty + non-family → no edge (connection to you is implied)
const edges = []
const edgeStyle = { stroke: 'rgba(96,165,250,0.6)', strokeWidth: 1.5 }
for (const node of personNodes) {
  const lt = node._linkedThrough
  if (lt) {
    for (const name of lt.split(',').map(s => s.trim()).filter(Boolean)) {
      const sourceId = nameIndex.get(name.toLowerCase())
      if (sourceId) {
        edges.push({ id: id(), source: sourceId, target: node.id, type: 'straight', style: edgeStyle })
      } else {
        console.warn(`linked_through not found: "${name}" (from "${node.data.name}") — no edge created`)
      }
    }
  } else {
    const rel = node.data.relationship.toLowerCase().trim()
    if (FAMILY_RELATIONSHIPS.has(rel)) {
      edges.push({ id: id(), source: selfNode.id, target: node.id, type: 'straight', style: edgeStyle })
    }
  }
}

// Strip internal _linkedThrough field before saving
const cleanNodes = personNodes.map(({ _linkedThrough: _, ...rest }) => rest)
const allNodes = [...cleanNodes, selfNode]

console.log(`nodes: ${allNodes.length}  edges: ${edges.length}`)

const store = { state: { nodes: allNodes, edges, selectedNodeId: null }, version: 0 }
const json = JSON.stringify(store)

writeFileSync('scripts/seed-data.json', json)

const html = `<!DOCTYPE html><html><head><title>Seeding...</title></head><body><script>localStorage.setItem('network-app-storage',${JSON.stringify(json)});window.location.href='/';<\/script></body></html>`
writeFileSync('public/seed.html', html)

console.log('Written: scripts/seed-data.json + public/seed.html')
