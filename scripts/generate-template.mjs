import * as XLSX from 'xlsx'

const headers = [
  'name',
  'contact_category',
  'company',
  'relationship',
  'location',
  'contact_method',
  'contact_value',
  'connected_date',
  'last_contact',
  'reminder_note',
]

const sampleRows = [
  [
    'Jane Smith', 'professional', 'Acme Corp', '',
    'San Francisco, CA', 'linkedin', 'linkedin.com/in/janesmith',
    '2025-01-15', '2026-04-20', 'Follow up on roadmap discussion',
  ],
  [
    'John Doe', 'personal', '', 'Friend',
    'New York, NY', 'email', 'john@example.com',
    '2024-06-01', '2026-02-10', 'Coffee meetup',
  ],
]

const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows])

ws['!cols'] = [
  { wch: 22 }, // name
  { wch: 16 }, // contact_category
  { wch: 20 }, // company
  { wch: 14 }, // relationship
  { wch: 22 }, // location
  { wch: 14 }, // contact_method
  { wch: 36 }, // contact_value
  { wch: 14 }, // connected_date
  { wch: 12 }, // last_contact
  { wch: 36 }, // reminder_note
]

const legendHeaders = ['Column', 'Required?', 'Allowed Values / Notes']
const legendRows = [
  ['name',             'Yes', 'Full name of the contact'],
  ['contact_category', 'No',  'professional (default) | personal'],
  ['company',          'No',  'Employer — use for professional contacts'],
  ['relationship',     'No',  'Family | Friend | Partner | Mentor | Mentee | Classmate | Neighbor | Acquaintance | Other — sets category to personal automatically'],
  ['location',         'No',  'City, State / Country'],
  ['contact_method',   'No',  'linkedin (default) | email | phone | other'],
  ['contact_value',    'No',  'LinkedIn URL, email address, phone number, etc.'],
  ['connected_date',   'No',  'YYYY-MM-DD or MM/DD/YYYY — when you first connected'],
  ['last_contact',     'No',  'YYYY-MM-DD or MM/DD/YYYY — most recent interaction'],
  ['reminder_note',    'No',  'Notes or reminder for next follow-up'],
]

const legendWs = XLSX.utils.aoa_to_sheet([legendHeaders, ...legendRows])
legendWs['!cols'] = [{ wch: 16 }, { wch: 10 }, { wch: 85 }]

const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb, ws, 'Contacts')
XLSX.utils.book_append_sheet(wb, legendWs, 'Legend')

XLSX.writeFile(wb, 'network-contacts-template.xlsx')
console.log('Template written: network-contacts-template.xlsx')
