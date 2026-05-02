import { randomUUID } from 'crypto'
import { writeFileSync } from 'fs'

const id = () => randomUUID()

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function gridPos(i) {
  const cols = 8
  return { x: 120 + (i % cols) * 280, y: 120 + Math.floor(i / cols) * 220 }
}

// ---- PERSON NODES (30) ----
const people = [
  // Hot stars — contacted within 30 days (spectral white → yellow-white)
  { name:'Priya Sharma',    company:'Stripe',        location:'San Francisco, CA',  contactMethod:'linkedin', contactValue:'linkedin.com/in/priyasharma',   connectedDate:daysAgo(180), lastContact:daysAgo(5),   reminderNote:'Intro to PM team, follow up on roadmap role' },
  { name:'James Okafor',    company:'Anthropic',     location:'San Francisco, CA',  contactMethod:'email',    contactValue:'james.okafor@anthropic.com',    connectedDate:daysAgo(210), lastContact:daysAgo(8),   reminderNote:'Referred by Marcus, safety team lead' },
  { name:'Sofia Reyes',     company:'Figma',         location:'San Francisco, CA',  contactMethod:'linkedin', contactValue:'linkedin.com/in/sofiareyes',    connectedDate:daysAgo(90),  lastContact:daysAgo(12),  reminderNote:'Design systems lead, strong connection' },
  { name:'Ethan Park',      company:'Linear',        location:'Remote',             contactMethod:'other',    contactValue:'@ethanpark on Slack',           connectedDate:daysAgo(60),  lastContact:daysAgo(3),   reminderNote:'Met at Config 2025, wants to collaborate' },
  { name:'Nadia Volkov',    company:'Vercel',        location:'New York, NY',       contactMethod:'email',    contactValue:'nadia.v@vercel.com',            connectedDate:daysAgo(45),  lastContact:daysAgo(20),  reminderNote:'Edge runtime team, referral pending' },
  { name:'Marcus Webb',     company:'OpenAI',        location:'San Francisco, CA',  contactMethod:'linkedin', contactValue:'linkedin.com/in/marcuswebb',    connectedDate:daysAgo(300), lastContact:daysAgo(15),  reminderNote:'Founding team. Keep warm, very well connected' },
  { name:'David Chen',      company:'a16z',          location:'San Francisco, CA',  contactMethod:'email',    contactValue:'dchen@a16z.com',                connectedDate:daysAgo(500), lastContact:daysAgo(22),  reminderNote:'Investor, extremely well connected. Key node.' },
  { name:'Sarah Okonkwo',   company:'YC',            location:'San Francisco, CA',  contactMethod:'linkedin', contactValue:'linkedin.com/in/sarahokonkwo',  connectedDate:daysAgo(600), lastContact:daysAgo(18),  reminderNote:'YC partner. Keeps introducing great people.' },
  { name:'Talia Rodriguez', company:'Sequoia',       location:'Menlo Park, CA',     contactMethod:'email',    contactValue:'talia.r@sequoia.com',           connectedDate:daysAgo(400), lastContact:daysAgo(30),  reminderNote:'Growth fund partner, consumer focus' },
  // Warm stars — 30-90 days (yellow to orange)
  { name:'Aisha Mensah',    company:'Notion',        location:'New York, NY',       contactMethod:'email',    contactValue:'aisha@notion.so',               connectedDate:daysAgo(120), lastContact:daysAgo(35),  reminderNote:'Product ops, interested in collaboration' },
  { name:'Luca Bianchi',    company:'Intercom',      location:'Dublin, Ireland',    contactMethod:'linkedin', contactValue:'linkedin.com/in/lucabianchi',   connectedDate:daysAgo(200), lastContact:daysAgo(42),  reminderNote:'Growth eng, met at SaaStr' },
  { name:'Rachel Kim',      company:'Stripe',        location:'Seattle, WA',        contactMethod:'email',    contactValue:'rachel.kim@stripe.com',         connectedDate:daysAgo(150), lastContact:daysAgo(50),  reminderNote:'Atlas team lead. Warm intro from Priya' },
  { name:'Omar Hassan',     company:'Shopify',       location:'Toronto, Canada',    contactMethod:'linkedin', contactValue:'linkedin.com/in/omarhassan',    connectedDate:daysAgo(90),  lastContact:daysAgo(55),  reminderNote:'Platform eng, ex-Google' },
  { name:'Yuki Tanaka',     company:'Figma',         location:'San Francisco, CA',  contactMethod:'other',    contactValue:'@yukitanaka Figma community',   connectedDate:daysAgo(130), lastContact:daysAgo(60),  reminderNote:'Proto team, introduced by Sofia' },
  { name:'Dario Esposito',  company:'Mistral AI',    location:'Paris, France',      contactMethod:'email',    contactValue:'dario@mistral.ai',              connectedDate:daysAgo(80),  lastContact:daysAgo(45),  reminderNote:'Research eng, pre-training focus' },
  { name:'Camille Dupont',  company:'Hugging Face',  location:'Paris, France',      contactMethod:'linkedin', contactValue:'linkedin.com/in/camilledupont', connectedDate:daysAgo(160), lastContact:daysAgo(70),  reminderNote:'OSS community lead, very responsive' },
  { name:'Ben Horowitz',    company:'Andreessen',    location:'San Francisco, CA',  contactMethod:'other',    contactValue:'@bhorowitz',                    connectedDate:daysAgo(700), lastContact:daysAgo(90),  reminderNote:'Advisor relationship, quarterly touchpoint' },
  { name:'Zoe Thompson',    company:'Canva',         location:'Sydney, Australia',  contactMethod:'email',    contactValue:'zoe.t@canva.com',               connectedDate:daysAgo(190), lastContact:daysAgo(85),  reminderNote:'Design eng, component library team' },
  // Cooling stars — 90-150 days (orange to pink)
  { name:'Tyler Brooks',    company:'Coinbase',      location:'Austin, TX',         contactMethod:'linkedin', contactValue:'linkedin.com/in/tylerbrooks',   connectedDate:daysAgo(240), lastContact:daysAgo(95),  reminderNote:'Infra lead, blockchain protocol work' },
  { name:'Ingrid Larsson',  company:'Spotify',       location:'Stockholm, Sweden',  contactMethod:'email',    contactValue:'ingrid.l@spotify.com',          connectedDate:daysAgo(180), lastContact:daysAgo(100), reminderNote:'Personalization ML, warm but slow to reply' },
  { name:'Kwame Asante',    company:'Flutterwave',   location:'Lagos, Nigeria',     contactMethod:'linkedin', contactValue:'linkedin.com/in/kwameasante',   connectedDate:daysAgo(200), lastContact:daysAgo(110), reminderNote:'Fintech BD, expanding to US market' },
  { name:'Mei Lin',         company:'ByteDance',     location:'Singapore',          contactMethod:'email',    contactValue:'mei.lin@bytedance.com',          connectedDate:daysAgo(270), lastContact:daysAgo(120), reminderNote:'Ads ranking team. Need to reconnect' },
  { name:'Arjun Patel',     company:'Razorpay',      location:'Bangalore, India',   contactMethod:'linkedin', contactValue:'linkedin.com/in/arjunpatel',    connectedDate:daysAgo(220), lastContact:daysAgo(130), reminderNote:'Co-founder contact via YC network' },
  { name:'Felix Wagner',    company:'Celonis',       location:'Munich, Germany',    contactMethod:'linkedin', contactValue:'linkedin.com/in/felixwagner',   connectedDate:daysAgo(300), lastContact:daysAgo(115), reminderNote:'Process mining, enterprise sales contact' },
  // Cold stars — 150-180+ days (pink to deep red — need urgent outreach)
  { name:'Adaeze Nwosu',    company:'Paystack',      location:'Lagos, Nigeria',     contactMethod:'email',    contactValue:'adaeze@paystack.com',            connectedDate:daysAgo(400), lastContact:daysAgo(155), reminderNote:'Reach out now, been out of touch too long' },
  { name:'Hugo Leclerc',    company:'Doctolib',      location:'Paris, France',      contactMethod:'linkedin', contactValue:'linkedin.com/in/hugoleclerc',   connectedDate:daysAgo(350), lastContact:daysAgo(160), reminderNote:'Health-tech, strong BD background' },
  { name:'Sven Eriksson',   company:'Klarna',        location:'Stockholm, Sweden',  contactMethod:'email',    contactValue:'sven.e@klarna.com',              connectedDate:daysAgo(420), lastContact:daysAgo(170), reminderNote:'Payments infra, was very interested in talking' },
  { name:'Nneka Obi',       company:'Andela',        location:'New York, NY',       contactMethod:'linkedin', contactValue:'linkedin.com/in/nnekaobi',      connectedDate:daysAgo(500), lastContact:daysAgo(185), reminderNote:'Talent ops lead, reconnect urgently' },
  { name:'Paulo Salave',    company:'Nubank',        location:'Sao Paulo, Brazil',  contactMethod:'email',    contactValue:'paulo.s@nubank.com.br',          connectedDate:daysAgo(450), lastContact:daysAgo(175), reminderNote:'Credit infra lead, very warm last time' },
  { name:'Rania Al-Said',   company:'Careem',        location:'Dubai, UAE',         contactMethod:'linkedin', contactValue:'linkedin.com/in/raniaalsaid',   connectedDate:daysAgo(380), lastContact:daysAgo(162), reminderNote:'Mobility product, expanding to EU' },
]

// ---- JOB NODES (10) ----
const jobs = [
  { title:'Staff Engineer',       company:'Anthropic',  jobType:'interview',      date:daysAgo(10), notes:'Final round, technical and culture fit. Strong signal from James.' },
  { title:'Senior PM',            company:'Stripe',     jobType:'application',    date:daysAgo(25), notes:'Applied via Priya referral. Waiting on recruiter response.' },
  { title:'Design Systems Lead',  company:'Figma',      jobType:'recommendation', date:daysAgo(40), notes:'Sofia put in a strong word. Intro call scheduled.' },
  { title:'Product Engineer',     company:'Linear',     jobType:'recommendation', date:daysAgo(15), notes:'Ethan intro, small team, high ownership role.' },
  { title:'ML Engineer',          company:'Mistral AI', jobType:'application',    date:daysAgo(60), notes:'Applied cold. Dario can refer if I reach out.' },
  { title:'Growth Engineer',      company:'Vercel',     jobType:'interview',      date:daysAgo(5),  notes:'Phone screen done. Next: system design with infra team.' },
  { title:'Founding Engineer',    company:'Stealth AI', jobType:'recommendation', date:daysAgo(20), notes:'David Chen intro, pre-seed, $4M raised. Interesting.' },
  { title:'Senior Backend Eng',   company:'Notion',     jobType:'application',    date:daysAgo(45), notes:'Aisha flagged the opening. Applied directly.' },
  { title:'Platform Eng',         company:'Shopify',    jobType:'recommendation', date:daysAgo(30), notes:'Omar Hassan referral, commerce platform team.' },
  { title:'AI Research Eng',      company:'OpenAI',     jobType:'recommendation', date:daysAgo(55), notes:'Marcus Webb intro. Requires strong ML background.' },
  { title:'Principal Engineer',   company:'Meta',       jobType:'dead_end',       date:daysAgo(90), notes:'Rejected after final round. Strong feedback but no headcount.' },
]

const interactions = [4,6,2,3,1,8,12,10,7,2,3,1,2,2,4,3,9,2,1,1,2,1,3,1,0,1,0,0,1,0]

const personNodes = people.map((p, i) => ({
  id: id(),
  type: 'person',
  position: gridPos(i),
  data: {
    nodeType: 'person',
    name: p.name,
    company: p.company,
    location: p.location,
    contactMethod: p.contactMethod,
    contactValue: p.contactValue,
    connectedDate: p.connectedDate,
    lastContact: p.lastContact,
    nextFollowUp: '',
    reminderNote: p.reminderNote,
    followUpMode: 'auto',
    customIntervalDays: 30,
    interactionCount: interactions[i] ?? 0,
  }
}))

const jobNodes = jobs.map((j, i) => ({
  id: id(),
  type: 'job',
  position: gridPos(people.length + i),
  data: {
    nodeType: 'job',
    title: j.title,
    company: j.company,
    jobType: j.jobType,
    date: j.date,
    notes: j.notes,
  }
}))

const selfNode = {
  id: id(),
  type: 'self',
  position: { x: 0, y: 0 },
  data: { nodeType: 'self', name: 'You' },
}

const allNodes = [...personNodes, ...jobNodes, selfNode]

const pid = (name) => personNodes.find(n => n.data.name === name)?.id
const jid = (title) => jobNodes.find(n => n.data.title === title)?.id
const sid = selfNode.id

const connections = [
  // Hub nodes (David Chen, Sarah Okonkwo, Marcus Webb have many spokes)
  [pid('David Chen'),      pid('Marcus Webb')],
  [pid('David Chen'),      pid('Priya Sharma')],
  [pid('David Chen'),      pid('Talia Rodriguez')],
  [pid('David Chen'),      pid('Ben Horowitz')],
  [pid('David Chen'),      pid('Ethan Park')],
  [pid('David Chen'),      pid('Dario Esposito')],
  [pid('David Chen'),      pid('Arjun Patel')],
  [pid('Sarah Okonkwo'),   pid('Priya Sharma')],
  [pid('Sarah Okonkwo'),   pid('Marcus Webb')],
  [pid('Sarah Okonkwo'),   pid('Omar Hassan')],
  [pid('Sarah Okonkwo'),   pid('Arjun Patel')],
  [pid('Sarah Okonkwo'),   pid('Adaeze Nwosu')],
  [pid('Sarah Okonkwo'),   pid('Kwame Asante')],
  [pid('Marcus Webb'),     pid('James Okafor')],
  [pid('Marcus Webb'),     pid('Nadia Volkov')],
  // San Francisco tech cluster
  [pid('Priya Sharma'),    pid('Rachel Kim')],
  [pid('Priya Sharma'),    pid('James Okafor')],
  [pid('Sofia Reyes'),     pid('Yuki Tanaka')],
  [pid('Sofia Reyes'),     pid('Ethan Park')],
  [pid('Nadia Volkov'),    pid('Ethan Park')],
  // Paris cluster
  [pid('Camille Dupont'),  pid('Dario Esposito')],
  [pid('Camille Dupont'),  pid('Hugo Leclerc')],
  // Stockholm cluster
  [pid('Ingrid Larsson'),  pid('Sven Eriksson')],
  [pid('Felix Wagner'),    pid('Sven Eriksson')],
  // Africa cluster
  [pid('Kwame Asante'),    pid('Adaeze Nwosu')],
  [pid('Kwame Asante'),    pid('Nneka Obi')],
  // Asia
  [pid('Arjun Patel'),     pid('Mei Lin')],
  [pid('Mei Lin'),         pid('Yuki Tanaka')],
  // Investor web
  [pid('Ben Horowitz'),    pid('Talia Rodriguez')],
  [pid('Talia Rodriguez'), pid('Zoe Thompson')],
  [pid('Talia Rodriguez'), pid('Tyler Brooks')],
  // Misc
  [pid('Aisha Mensah'),    pid('Luca Bianchi')],
  [pid('Rania Al-Said'),   pid('Paulo Salave')],
  [pid('Omar Hassan'),     pid('Tyler Brooks')],
  // Self → key hubs
  [sid, pid('David Chen')],
  [sid, pid('Sarah Okonkwo')],
  [sid, pid('Marcus Webb')],
  [sid, pid('Priya Sharma')],
  [sid, pid('Ben Horowitz')],
  // Person → Job
  [pid('James Okafor'),    jid('Staff Engineer')],
  [pid('Marcus Webb'),     jid('Staff Engineer')],
  [pid('Priya Sharma'),    jid('Senior PM')],
  [pid('Sofia Reyes'),     jid('Design Systems Lead')],
  [pid('Ethan Park'),      jid('Product Engineer')],
  [pid('Dario Esposito'),  jid('ML Engineer')],
  [pid('Nadia Volkov'),    jid('Growth Engineer')],
  [pid('David Chen'),      jid('Founding Engineer')],
  [pid('Sarah Okonkwo'),   jid('Founding Engineer')],
  [pid('Aisha Mensah'),    jid('Senior Backend Eng')],
  [pid('Omar Hassan'),     jid('Platform Eng')],
  [pid('Marcus Webb'),     jid('AI Research Eng')],
].filter(([a, b]) => a && b)

const edges = connections.map(([source, target]) => ({
  id: id(),
  source,
  target,
  type: 'straight',
  style: { stroke: 'rgba(147,197,253,0.22)', strokeWidth: 1 },
}))

const store = {
  state: { nodes: allNodes, edges, selectedNodeId: null },
  version: 0,
}

writeFileSync('scripts/seed-data.json', JSON.stringify(store))
console.log(`nodes: ${allNodes.length}  edges: ${edges.length}`)
