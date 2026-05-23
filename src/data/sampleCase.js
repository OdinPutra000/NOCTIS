// ===== NOCTIS SAMPLE CASE DATA =====
// Realistic cyber investigation scenario: "Operation Ghost Wire"

export const SAMPLE_CASE = {
  id: 'CASE-2026-0847',
  name: 'Operation Ghost Wire',
  type: 'Cyber Investigation',
  status: 'ACTIVE',
  createdAt: '2026-05-10T08:30:00Z',
  analyst: 'Agent Keval',
  classification: 'CLASSIFIED',
  description: 'Investigation into suspected coordinated cyber intrusion campaign targeting financial infrastructure through compromised supply chain vendors.',

  rawIntelligence: `INCIDENT REPORT — Operation Ghost Wire
Date: 2026-05-10
Classification: CLASSIFIED

On 2026-05-08, anomalous network traffic was detected originating from internal servers at Meridian Financial Corp (192.168.1.45, 10.0.0.23). Initial analysis traced C2 communications to external IP 185.234.72.19, linked to domain shadowrelay.net. DNS resolution also pointed to cdn-update.ghostwire.io.

Subject Rajan Malhotra (rajan.m@meridianfc.com, +91-98765-43210) — Senior Infrastructure Engineer at Meridian — had elevated access to the compromised systems. Login logs show access from both his registered device (DEV-MRJ-4401) and an unregistered device (DEV-UNKNOWN-7788) during off-hours.

Communications intercepted between rajan.m@meridianfc.com and unknown@protonmail.com suggest coordination. Phone records show calls between +91-98765-43210 and +44-7700-900123 (registered to Alexei Volkov).

Alexei Volkov — suspected operator based in London (51.5074, -0.1278). Associated with previous infrastructure attacks. Known to use device DEV-AXV-1122. Email: alexei.v@darkmail.net.

IP 185.234.72.19 is hosted by OmegaHost Ltd (organization), a bulletproof hosting provider in Moldova (47.0105, 28.8638). Domain ghostwire.io was registered through the same provider.

Additional subject: Priya Sharma (priya.s@meridianfc.com, +91-87654-32109), Security Analyst at Meridian Financial Corp. Her device DEV-PRS-3301 shows access to threat logs but no anomalous behavior. She reported the initial alert.

Funding trace leads to cryptocurrency wallet linked to Viktor Petrov (viktor.p@securemail.ch), located in Zurich (47.3769, 8.5417). Phone: +41-44-123-4567. Associated with organization DarkVault Group.

Location data suggests meetings at Cafe Mondrian, Mumbai (19.0760, 72.8777) between Rajan Malhotra and an unknown individual on 2026-05-05 and 2026-05-07.

Server 10.0.0.23 at Meridian HQ, Mumbai was the primary target. Additional reconnaissance detected against backup-srv.meridianfc.com (10.0.0.50).

Timeline of key events:
- 2026-05-01: Rajan's device first connects to shadowrelay.net
- 2026-05-03: Unusual data transfer from 10.0.0.23 (2.3GB)
- 2026-05-05: Meeting at Cafe Mondrian, Mumbai
- 2026-05-06: New device DEV-UNKNOWN-7788 appears on network
- 2026-05-07: Second meeting at Cafe Mondrian
- 2026-05-08: C2 communication spike detected
- 2026-05-09: Priya Sharma files incident report
- 2026-05-10: Investigation initiated`,

  entities: [
    { id: 'e1', name: 'Rajan Malhotra', type: 'person', risk: 87, status: 'SUSPECT', metadata: { role: 'Senior Infrastructure Engineer', organization: 'Meridian Financial Corp', email: 'rajan.m@meridianfc.com', phone: '+91-98765-43210', clearance: 'Level 3', lastActivity: '2026-05-08T22:15:00Z' }, location: { lat: 19.0760, lng: 72.8777, label: 'Mumbai, India' } },
    { id: 'e2', name: 'Alexei Volkov', type: 'person', risk: 92, status: 'SUSPECT', metadata: { role: 'Suspected Operator', organization: 'Unknown', email: 'alexei.v@darkmail.net', phone: '+44-7700-900123', clearance: 'N/A', lastActivity: '2026-05-08T23:45:00Z' }, location: { lat: 51.5074, lng: -0.1278, label: 'London, UK' } },
    { id: 'e3', name: 'Priya Sharma', type: 'person', risk: 15, status: 'WITNESS', metadata: { role: 'Security Analyst', organization: 'Meridian Financial Corp', email: 'priya.s@meridianfc.com', phone: '+91-87654-32109', clearance: 'Level 2', lastActivity: '2026-05-09T09:30:00Z' }, location: { lat: 19.0760, lng: 72.8777, label: 'Mumbai, India' } },
    { id: 'e4', name: 'Viktor Petrov', type: 'person', risk: 78, status: 'PERSON OF INTEREST', metadata: { role: 'Financial Facilitator', organization: 'DarkVault Group', email: 'viktor.p@securemail.ch', phone: '+41-44-123-4567', clearance: 'N/A', lastActivity: '2026-05-07T14:20:00Z' }, location: { lat: 47.3769, lng: 8.5417, label: 'Zurich, Switzerland' } },
    { id: 'e5', name: 'DEV-MRJ-4401', type: 'device', risk: 65, status: 'COMPROMISED', metadata: { owner: 'Rajan Malhotra', type: 'Workstation', os: 'Windows 11 Pro', mac: '00:1B:44:11:3A:B7', lastActivity: '2026-05-08T22:15:00Z' }, location: { lat: 19.0760, lng: 72.8777, label: 'Mumbai, India' } },
    { id: 'e6', name: 'DEV-UNKNOWN-7788', type: 'device', risk: 95, status: 'SUSPICIOUS', metadata: { owner: 'Unknown', type: 'Unknown Device', os: 'Linux', mac: 'DE:AD:BE:EF:CA:FE', lastActivity: '2026-05-08T03:22:00Z' }, location: { lat: 19.0760, lng: 72.8777, label: 'Mumbai, India' } },
    { id: 'e7', name: 'DEV-AXV-1122', type: 'device', risk: 70, status: 'FLAGGED', metadata: { owner: 'Alexei Volkov', type: 'Laptop', os: 'Tails OS', mac: 'AA:BB:CC:DD:EE:FF', lastActivity: '2026-05-08T23:45:00Z' }, location: { lat: 51.5074, lng: -0.1278, label: 'London, UK' } },
    { id: 'e8', name: 'DEV-PRS-3301', type: 'device', risk: 10, status: 'CLEAN', metadata: { owner: 'Priya Sharma', type: 'Workstation', os: 'Windows 11 Pro', mac: '00:1B:44:22:5C:D9', lastActivity: '2026-05-09T09:30:00Z' }, location: { lat: 19.0760, lng: 72.8777, label: 'Mumbai, India' } },
    { id: 'e9', name: '185.234.72.19', type: 'ip', risk: 98, status: 'MALICIOUS', metadata: { hosting: 'OmegaHost Ltd', country: 'Moldova', asn: 'AS12345', purpose: 'C2 Server', lastActivity: '2026-05-08T23:59:00Z' }, location: { lat: 47.0105, lng: 28.8638, label: 'Chisinau, Moldova' } },
    { id: 'e10', name: '192.168.1.45', type: 'ip', risk: 55, status: 'INTERNAL', metadata: { network: 'Meridian Corp LAN', purpose: 'Application Server', lastActivity: '2026-05-08T22:00:00Z' }, location: { lat: 19.0760, lng: 72.8777, label: 'Mumbai, India' } },
    { id: 'e11', name: '10.0.0.23', type: 'ip', risk: 72, status: 'TARGETED', metadata: { network: 'Meridian Corp Internal', purpose: 'Primary Data Server', lastActivity: '2026-05-08T22:15:00Z' }, location: { lat: 19.0760, lng: 72.8777, label: 'Mumbai, India' } },
    { id: 'e12', name: 'shadowrelay.net', type: 'domain', risk: 96, status: 'MALICIOUS', metadata: { registrar: 'Anonymous Registrar', registered: '2026-04-15', ip: '185.234.72.19', purpose: 'C2 Domain', lastActivity: '2026-05-08T23:59:00Z' }, location: { lat: 47.0105, lng: 28.8638, label: 'Moldova' } },
    { id: 'e13', name: 'ghostwire.io', type: 'domain', risk: 90, status: 'MALICIOUS', metadata: { registrar: 'Anonymous Registrar', registered: '2026-04-20', ip: '185.234.72.19', purpose: 'Payload Distribution', lastActivity: '2026-05-07T18:00:00Z' }, location: { lat: 47.0105, lng: 28.8638, label: 'Moldova' } },
    { id: 'e14', name: 'Meridian Financial Corp', type: 'organization', risk: 45, status: 'VICTIM', metadata: { industry: 'Financial Services', employees: '2,500+', hq: 'Mumbai, India', sector: 'Banking & Finance', lastActivity: '2026-05-10T08:30:00Z' }, location: { lat: 19.0760, lng: 72.8777, label: 'Mumbai, India' } },
    { id: 'e15', name: 'OmegaHost Ltd', type: 'organization', risk: 88, status: 'SUSPICIOUS', metadata: { industry: 'Hosting Provider', type: 'Bulletproof Hosting', hq: 'Moldova', reputation: 'Known for abuse', lastActivity: '2026-05-08T23:59:00Z' }, location: { lat: 47.0105, lng: 28.8638, label: 'Chisinau, Moldova' } },
    { id: 'e16', name: 'DarkVault Group', type: 'organization', risk: 85, status: 'UNDER INVESTIGATION', metadata: { industry: 'Unknown', type: 'Financial Operations', hq: 'Zurich, Switzerland', reputation: 'Suspected laundering', lastActivity: '2026-05-07T14:20:00Z' }, location: { lat: 47.3769, lng: 8.5417, label: 'Zurich, Switzerland' } },
    { id: 'e17', name: 'Cafe Mondrian', type: 'location', risk: 40, status: 'SURVEILLED', metadata: { type: 'Meeting Point', address: 'Bandra West, Mumbai', significance: 'Multiple suspect meetings', lastActivity: '2026-05-07T20:00:00Z' }, location: { lat: 19.0596, lng: 72.8295, label: 'Bandra, Mumbai' } },
    { id: 'e18', name: 'rajan.m@meridianfc.com', type: 'email', risk: 75, status: 'MONITORED', metadata: { owner: 'Rajan Malhotra', provider: 'Corporate', suspicious_comms: 12, lastActivity: '2026-05-08T21:30:00Z' }, location: { lat: 19.0760, lng: 72.8777, label: 'Mumbai, India' } },
    { id: 'e19', name: 'unknown@protonmail.com', type: 'email', risk: 93, status: 'SUSPICIOUS', metadata: { owner: 'Unknown', provider: 'ProtonMail', suspicious_comms: 8, lastActivity: '2026-05-08T22:00:00Z' }, location: null },
    { id: 'e20', name: '+91-98765-43210', type: 'phone', risk: 70, status: 'MONITORED', metadata: { owner: 'Rajan Malhotra', carrier: 'Jio', suspicious_calls: 6, lastActivity: '2026-05-08T20:45:00Z' }, location: { lat: 19.0760, lng: 72.8777, label: 'Mumbai, India' } },
  ],

  relationships: [
    { id: 'r1', source: 'e1', target: 'e5', type: 'owns', label: 'Owns Device', suspicious: false, weight: 3 },
    { id: 'r2', source: 'e1', target: 'e6', type: 'accessed', label: 'Accessed Unknown Device', suspicious: true, weight: 8 },
    { id: 'r3', source: 'e1', target: 'e18', type: 'uses', label: 'Uses Email', suspicious: false, weight: 2 },
    { id: 'r4', source: 'e1', target: 'e14', type: 'employed_by', label: 'Employed By', suspicious: false, weight: 1 },
    { id: 'r5', source: 'e1', target: 'e2', type: 'communicated', label: 'Phone Communication', suspicious: true, weight: 9 },
    { id: 'r6', source: 'e1', target: 'e17', type: 'visited', label: 'Visited Location', suspicious: true, weight: 6 },
    { id: 'r7', source: 'e2', target: 'e7', type: 'owns', label: 'Owns Device', suspicious: false, weight: 3 },
    { id: 'r8', source: 'e2', target: 'e9', type: 'connected_to', label: 'Connected to C2', suspicious: true, weight: 10 },
    { id: 'r9', source: 'e3', target: 'e8', type: 'owns', label: 'Owns Device', suspicious: false, weight: 1 },
    { id: 'r10', source: 'e3', target: 'e14', type: 'employed_by', label: 'Employed By', suspicious: false, weight: 1 },
    { id: 'r11', source: 'e5', target: 'e11', type: 'accessed', label: 'Accessed Server', suspicious: true, weight: 7 },
    { id: 'r12', source: 'e5', target: 'e12', type: 'resolved', label: 'DNS Resolution', suspicious: true, weight: 8 },
    { id: 'r13', source: 'e6', target: 'e11', type: 'accessed', label: 'Unauthorized Access', suspicious: true, weight: 10 },
    { id: 'r14', source: 'e6', target: 'e10', type: 'connected_to', label: 'Network Connection', suspicious: true, weight: 7 },
    { id: 'r15', source: 'e9', target: 'e12', type: 'hosts', label: 'Hosts Domain', suspicious: true, weight: 9 },
    { id: 'r16', source: 'e9', target: 'e13', type: 'hosts', label: 'Hosts Domain', suspicious: true, weight: 9 },
    { id: 'r17', source: 'e9', target: 'e15', type: 'hosted_by', label: 'Hosted By', suspicious: true, weight: 8 },
    { id: 'r18', source: 'e18', target: 'e19', type: 'communicated', label: 'Email Exchange', suspicious: true, weight: 9 },
    { id: 'r19', source: 'e4', target: 'e16', type: 'associated', label: 'Associated With', suspicious: true, weight: 7 },
    { id: 'r20', source: 'e4', target: 'e2', type: 'financial_link', label: 'Financial Connection', suspicious: true, weight: 8 },
    { id: 'r21', source: 'e20', target: 'e1', type: 'belongs_to', label: 'Phone Owner', suspicious: false, weight: 2 },
    { id: 'r22', source: 'e12', target: 'e13', type: 'linked', label: 'Infrastructure Link', suspicious: true, weight: 7 },
    { id: 'r23', source: 'e11', target: 'e14', type: 'belongs_to', label: 'Organization Asset', suspicious: false, weight: 2 },
    { id: 'r24', source: 'e10', target: 'e14', type: 'belongs_to', label: 'Organization Asset', suspicious: false, weight: 2 },
    { id: 'r25', source: 'e15', target: 'e16', type: 'financial_link', label: 'Financial Ties', suspicious: true, weight: 6 },
  ],

  events: [
    { id: 'ev1', timestamp: '2026-05-01T14:30:00Z', type: 'network', title: 'Initial C2 Contact', description: 'DEV-MRJ-4401 first connects to shadowrelay.net', entities: ['e5', 'e12'], severity: 'high', category: 'communication' },
    { id: 'ev2', timestamp: '2026-05-02T09:15:00Z', type: 'alert', title: 'Anomalous DNS Query', description: 'Unusual DNS resolution pattern detected for ghostwire.io', entities: ['e13'], severity: 'medium', category: 'alert' },
    { id: 'ev3', timestamp: '2026-05-03T02:45:00Z', type: 'data', title: 'Large Data Transfer', description: '2.3GB data exfiltration from server 10.0.0.23', entities: ['e11', 'e9'], severity: 'critical', category: 'incident' },
    { id: 'ev4', timestamp: '2026-05-04T16:00:00Z', type: 'communication', title: 'Encrypted Call', description: 'Rajan Malhotra calls +44-7700-900123 (Alexei Volkov) — 23 minutes', entities: ['e1', 'e2', 'e20'], severity: 'high', category: 'communication' },
    { id: 'ev5', timestamp: '2026-05-05T19:30:00Z', type: 'movement', title: 'Meeting at Cafe Mondrian', description: 'Rajan Malhotra meets unknown individual at Cafe Mondrian, Bandra', entities: ['e1', 'e17'], severity: 'high', category: 'movement' },
    { id: 'ev6', timestamp: '2026-05-06T01:12:00Z', type: 'network', title: 'Unknown Device Connected', description: 'DEV-UNKNOWN-7788 appears on Meridian internal network', entities: ['e6', 'e10'], severity: 'critical', category: 'incident' },
    { id: 'ev7', timestamp: '2026-05-06T03:30:00Z', type: 'data', title: 'Lateral Movement Detected', description: 'DEV-UNKNOWN-7788 scans internal subnet and accesses 10.0.0.23', entities: ['e6', 'e11'], severity: 'critical', category: 'incident' },
    { id: 'ev8', timestamp: '2026-05-07T11:00:00Z', type: 'financial', title: 'Cryptocurrency Transfer', description: 'Wallet linked to Viktor Petrov receives 4.7 BTC from unknown source', entities: ['e4'], severity: 'high', category: 'financial' },
    { id: 'ev9', timestamp: '2026-05-07T20:00:00Z', type: 'movement', title: 'Second Meeting at Cafe Mondrian', description: 'Rajan Malhotra second meeting at same location', entities: ['e1', 'e17'], severity: 'medium', category: 'movement' },
    { id: 'ev10', timestamp: '2026-05-08T02:00:00Z', type: 'network', title: 'C2 Communication Spike', description: 'Massive spike in beaconing to 185.234.72.19 from internal network', entities: ['e9', 'e10', 'e11'], severity: 'critical', category: 'incident' },
    { id: 'ev11', timestamp: '2026-05-08T03:22:00Z', type: 'alert', title: 'Off-Hours Access Alert', description: 'DEV-UNKNOWN-7788 active during non-business hours', entities: ['e6'], severity: 'high', category: 'alert' },
    { id: 'ev12', timestamp: '2026-05-08T22:15:00Z', type: 'communication', title: 'Email to ProtonMail', description: 'rajan.m@meridianfc.com sends encrypted email to unknown@protonmail.com', entities: ['e18', 'e19'], severity: 'high', category: 'communication' },
    { id: 'ev13', timestamp: '2026-05-09T09:30:00Z', type: 'report', title: 'Incident Report Filed', description: 'Priya Sharma files formal incident report to security team', entities: ['e3'], severity: 'low', category: 'administrative' },
    { id: 'ev14', timestamp: '2026-05-10T08:30:00Z', type: 'investigation', title: 'Investigation Initiated', description: 'Operation Ghost Wire formally opened', entities: [], severity: 'medium', category: 'administrative' },
    { id: 'ev15', timestamp: '2026-05-06T15:00:00Z', type: 'communication', title: 'Volkov-Petrov Call', description: 'Alexei Volkov calls Viktor Petrov — 8 minutes, encrypted', entities: ['e2', 'e4'], severity: 'high', category: 'communication' },
  ],

  // ===== V2 RICH BEHAVIORAL DATA STRUCTURES =====
  communications: [
    { timestamp: '2026-05-01T10:00:00Z', source: 'e18', target: 'e19', channel: 'secure_email', duration: 0, bytes: 4096 },
    { timestamp: '2026-05-02T15:30:00Z', source: 'e20', target: 'e2', channel: 'satellite_phone', duration: 180, bytes: 0 },
    { timestamp: '2026-05-03T23:12:00Z', source: 'e18', target: 'e19', channel: 'encrypted_voip', duration: 420, bytes: 18450 },
    { timestamp: '2026-05-04T16:00:00Z', source: 'e20', target: 'e2', channel: 'encrypted_voip', duration: 1380, bytes: 48900 },
    { timestamp: '2026-05-05T01:45:00Z', source: 'e18', target: 'e19', channel: 'secure_email', duration: 0, bytes: 104230 },
    { timestamp: '2026-05-06T15:00:00Z', source: 'e2', target: 'e4', channel: 'encrypted_voip', duration: 480, bytes: 12400 },
    { timestamp: '2026-05-07T03:22:00Z', source: 'e18', target: 'e19', channel: 'secure_email', duration: 0, bytes: 1420 },
    { timestamp: '2026-05-08T02:00:00Z', source: 'e5', target: 'e9', channel: 'c2_beacon', duration: 12, bytes: 240 },
    { timestamp: '2026-05-08T02:05:00Z', source: 'e6', target: 'e9', channel: 'c2_beacon', duration: 15, bytes: 450 },
    { timestamp: '2026-05-08T22:15:00Z', source: 'e18', target: 'e19', channel: 'secure_email', duration: 0, bytes: 3200 },
  ],

  locationHistory: {
    'e1': [
      { timestamp: '2026-05-01T09:00:00Z', lat: 19.0760, lng: 72.8777, label: 'Meridian HQ, Mumbai' },
      { timestamp: '2026-05-03T18:30:00Z', lat: 19.0596, lng: 72.8295, label: 'Bandra, Mumbai' },
      { timestamp: '2026-05-05T19:30:00Z', lat: 19.0596, lng: 72.8295, label: 'Cafe Mondrian, Mumbai' },
      { timestamp: '2026-05-07T20:00:00Z', lat: 19.0596, lng: 72.8295, label: 'Cafe Mondrian, Mumbai' },
      { timestamp: '2026-05-08T22:15:00Z', lat: 19.0760, lng: 72.8777, label: 'Meridian HQ, Mumbai' }
    ],
    'e2': [
      { timestamp: '2026-05-01T08:00:00Z', lat: 51.5074, lng: -0.1278, label: 'Safehouse, London' },
      { timestamp: '2026-05-04T12:00:00Z', lat: 51.5074, lng: -0.1278, label: 'Internet Cafe, London' },
      { timestamp: '2026-05-08T23:45:00Z', lat: 51.5074, lng: -0.1278, label: 'Safehouse, London' }
    ],
    'e4': [
      { timestamp: '2026-05-02T10:00:00Z', lat: 47.3769, lng: 8.5417, label: 'Private Office, Zurich' },
      { timestamp: '2026-05-07T14:20:00Z', lat: 47.3769, lng: 8.5417, label: 'Bank Vault, Zurich' }
    ],
    'e9': [
      { timestamp: '2026-05-01T00:00:00Z', lat: 47.0105, lng: 28.8638, label: 'Datacenter A, Chisinau' },
      { timestamp: '2026-05-06T00:00:00Z', lat: 47.0105, lng: 28.8638, label: 'Datacenter B, Chisinau' }
    ]
  },

  infrastructureHistory: [
    { timestamp: '2026-04-15T00:00:00Z', entityId: 'e12', event: 'Domain Registration', detail: 'shadowrelay.net registered through Moldovan registrar' },
    { timestamp: '2026-04-20T00:00:00Z', entityId: 'e13', event: 'Domain Registration', detail: 'ghostwire.io registered anonymously' },
    { timestamp: '2026-05-01T12:00:00Z', entityId: 'e9', event: 'Server Activation', detail: 'IP 185.234.72.19 active with bulletproof hosting constraints' },
    { timestamp: '2026-05-06T01:00:00Z', entityId: 'e12', event: 'DNS Migration', detail: 'shadowrelay.net pointed to IP 185.234.72.19' }
  ]
};

export const ENTITY_COLORS = {
  person: '#c0392b',
  device: '#7c3aed',
  email: '#d4910a',
  phone: '#0891b2',
  ip: '#2563eb',
  domain: '#0d9488',
  location: '#16a34a',
  organization: '#b8860b',
  event: '#6b7280',
};

export const ENTITY_ICON_LETTERS = {
  person: 'P',
  device: 'D',
  email: 'E',
  phone: 'H',
  ip: 'I',
  domain: 'N',
  location: 'L',
  organization: 'O',
  event: 'V',
};

export const ENTITY_TYPE_LABELS = {
  person: 'Person',
  device: 'Device',
  email: 'Email',
  phone: 'Phone',
  ip: 'IP Address',
  domain: 'Domain',
  location: 'Location',
  organization: 'Organization',
  event: 'Event',
};

export const CASE_TYPES = [
  'Cyber Investigation',
  'Criminal Network',
  'Threat Intelligence',
  'OSINT Investigation',
  'Infrastructure Analysis',
  'Custom',
];

export const VIEW_MODES = [
  { id: 'graph', label: 'Graph', icon: '◉' },
  { id: 'timeline', label: 'Timeline', icon: '◷' },
  { id: 'map', label: 'Map', icon: '◈' },
  { id: 'table', label: 'Table', icon: '☰' },
  { id: 'flow', label: 'Flow', icon: '⇢' },
  { id: 'globe', label: 'Globe', icon: '⊕' },
];
