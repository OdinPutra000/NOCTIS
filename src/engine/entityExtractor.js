// ===== NOCTIS ENTITY EXTRACTION ENGINE =====
// Regex + heuristic extraction from raw intelligence text

const PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,5}/g,
  ip: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  domain: /\b(?:[a-zA-Z0-9-]+\.)+(?:com|net|org|io|co|gov|edu|mil|info|biz|me|dev|app|xyz|ch|uk|de|ru|cn|in|au)\b/gi,
  timestamp: /\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)?/g,
  mac: /(?:[0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}/g,
  device: /DEV-[A-Z0-9-]+/g,
};

// Common name patterns (simplified - looks for capitalized word pairs/triples)
const NAME_PATTERN = /\b([A-Z][a-z]{2,}\s[A-Z][a-z]{2,}(?:\s[A-Z][a-z]{2,})?)\b/g;

// Organization patterns
const ORG_INDICATORS = ['Corp', 'Ltd', 'Inc', 'LLC', 'Group', 'Company', 'Foundation', 'Institute', 'Organization', 'Agency'];
const ORG_PATTERN = new RegExp(`\\b([A-Z][a-zA-Z]+(?:\\s[A-Z][a-zA-Z]+)*\\s(?:${ORG_INDICATORS.join('|')}))\\b`, 'g');

// Location indicators
const LOCATION_INDICATORS = ['Mumbai', 'London', 'Zurich', 'Moscow', 'Beijing', 'Tokyo', 'Berlin', 'Paris', 'New York', 'Washington', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata', 'Moldova', 'Chisinau'];

export function extractEntities(text) {
  if (!text || typeof text !== 'string') return [];

  const entities = [];
  const seen = new Set();

  function addEntity(name, type, metadata = {}) {
    const key = `${type}:${name.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    entities.push({
      id: `e_${entities.length + 1}`,
      name,
      type,
      risk: 0,
      status: 'DETECTED',
      metadata: { ...metadata, lastActivity: new Date().toISOString() },
      location: null,
    });
  }

  // Extract emails
  const emails = text.match(PATTERNS.email) || [];
  emails.forEach(email => addEntity(email, 'email', { provider: email.split('@')[1] }));

  // Extract IPs
  const ips = text.match(PATTERNS.ip) || [];
  ips.forEach(ip => {
    if (!ip.startsWith('0.') && ip !== '0.0.0.0') {
      addEntity(ip, 'ip', { 
        network: ip.startsWith('10.') || ip.startsWith('192.168.') ? 'Internal' : 'External'
      });
    }
  });

  // Extract domains
  const domains = text.match(PATTERNS.domain) || [];
  domains.forEach(domain => {
    const lower = domain.toLowerCase();
    if (!emails.some(e => e.includes(lower)) && !['gmail.com', 'yahoo.com', 'outlook.com'].includes(lower)) {
      addEntity(domain, 'domain', {});
    }
  });

  // Extract devices
  const devices = text.match(PATTERNS.device) || [];
  devices.forEach(dev => addEntity(dev, 'device', { type: 'Unknown Device' }));

  // Extract phones
  const phones = text.match(PATTERNS.phone) || [];
  phones.forEach(phone => {
    if (phone.replace(/\D/g, '').length >= 8) {
      addEntity(phone.trim(), 'phone', {});
    }
  });

  // Extract organizations
  const orgs = text.match(ORG_PATTERN) || [];
  orgs.forEach(org => addEntity(org, 'organization', {}));

  // Extract person names (simple heuristic)
  const names = text.match(NAME_PATTERN) || [];
  const excludeWords = new Set(['The', 'This', 'That', 'These', 'With', 'From', 'Into', 'Over', 'Each', 'Also', ...ORG_INDICATORS]);
  names.forEach(name => {
    const words = name.split(' ');
    if (words.some(w => excludeWords.has(w))) return;
    if (orgs.some(o => o.includes(name))) return;
    addEntity(name, 'person', {});
  });

  // Extract locations
  LOCATION_INDICATORS.forEach(loc => {
    if (text.includes(loc)) {
      addEntity(loc, 'location', { type: 'City' });
    }
  });

  return entities;
}

export function getEntityTypeColor(type) {
  const colors = {
    person: '#f85149',
    device: '#a371f7',
    ip: '#56d4dd',
    domain: '#58a6ff',
    location: '#3fb950',
    organization: '#e3b341',
    email: '#f778ba',
    phone: '#d2a8ff',
    event: '#ff7b72',
  };
  return colors[type] || '#8b949e';
}
