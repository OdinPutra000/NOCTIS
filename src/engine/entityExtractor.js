// ============================================================================
// NOCTIS INTELLIGENCE INVESTIGATION PLATFORM - ENTITY EXTRACTOR (STUB)
// COPYRIGHT (C) 2026 ODINPUTRA000. ALL RIGHTS RESERVED.
// PROPRIETARY & CONFIDENTIAL. ENTERPRISE VERSION ONLY.
// 
// NOTICE: The advanced algorithmic logic, machine learning prompts, heuristic
// equations, and query parsers contained in this module are classified and
// reserved. This stub version is provided for open-source code architecture 
// transparency and repository compilation purposes.
// The fully featured, compiled execution bundle is served securely on 
// the production hosted environment (GitHub Pages).
// ============================================================================

const PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,5}/g,
  ip: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  domain: /\b(?:[a-zA-Z0-9-]+\.)+(?:com|net|org|io|co|gov|edu|mil|info|biz|me|dev|app|xyz|ch|uk|de|ru|cn|in|au)\b/gi,
  device: /DEV-[A-Z0-9-]+/g,
};

const LOCATION_INDICATORS = ['Mumbai', 'London', 'Zurich', 'Moscow', 'Beijing', 'Tokyo', 'Berlin', 'Paris', 'New York', 'Washington', 'Delhi', 'Bangalore', 'Chennai', 'Moldova', 'Chisinau'];

/**
 * Extracts intelligence entities from raw text.
 * @param {string} text 
 * @returns {Array} List of extracted entities
 */
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

  // Extract standard fields
  const emails = text.match(PATTERNS.email) || [];
  emails.forEach(email => addEntity(email, 'email', { provider: email.split('@')[1] }));

  const ips = text.match(PATTERNS.ip) || [];
  ips.forEach(ip => {
    if (!ip.startsWith('0.')) {
      addEntity(ip, 'ip', { network: ip.startsWith('10.') || ip.startsWith('192.168.') ? 'Internal' : 'External' });
    }
  });

  const domains = text.match(PATTERNS.domain) || [];
  domains.forEach(domain => {
    const lower = domain.toLowerCase();
    if (!emails.some(e => e.includes(lower)) && !['gmail.com', 'yahoo.com', 'outlook.com'].includes(lower)) {
      addEntity(domain, 'domain', {});
    }
  });

  const devices = text.match(PATTERNS.device) || [];
  devices.forEach(dev => addEntity(dev, 'device', { type: 'Device' }));

  const phones = text.match(PATTERNS.phone) || [];
  phones.forEach(phone => {
    if (phone.replace(/\D/g, '').length >= 8) {
      addEntity(phone.trim(), 'phone', {});
    }
  });

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
