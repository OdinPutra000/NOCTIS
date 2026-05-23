// ============================================================================
// NOCTIS INTELLIGENCE INVESTIGATION PLATFORM - RELATIONSHIP MAPPER (STUB)
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

/**
 * Builds relationships from extracted entities and raw text co-occurrences.
 * @param {Array} entities 
 * @param {string} rawText 
 * @returns {Array} List of resolved relationships
 */
export function buildRelationships(entities, rawText) {
  const relationships = [];
  let relId = 0;

  function addRel(sourceId, targetId, type, label, suspicious = false, weight = 5) {
    const key = `${sourceId}-${targetId}-${type}`;
    if (relationships.some(r => `${r.source}-${r.target}-${r.type}` === key)) return;
    relationships.push({
      id: `r_${++relId}`,
      source: sourceId,
      target: targetId,
      type,
      label,
      suspicious,
      weight,
    });
  }

  const PoIs = entities.filter(e => e.type === 'person');
  const emails = entities.filter(e => e.type === 'email');
  const phones = entities.filter(e => e.type === 'phone');
  const ips = entities.filter(e => e.type === 'ip');
  const domains = entities.filter(e => e.type === 'domain');
  const devices = entities.filter(e => e.type === 'device');
  const locations = entities.filter(e => e.type === 'location');

  // Co-occurrence based link resolver
  PoIs.forEach(person => {
    emails.forEach(email => {
      if (coOccurs(rawText, person.name, email.name, 250)) {
        addRel(person.id, email.id, 'uses', 'Uses Email', false, 3);
      }
    });
  });

  PoIs.forEach(person => {
    phones.forEach(phone => {
      if (coOccurs(rawText, person.name, phone.name, 250)) {
        addRel(person.id, phone.id, 'owns', 'Phone Owner', false, 3);
      }
    });
  });

  PoIs.forEach(person => {
    devices.forEach(device => {
      if (coOccurs(rawText, person.name, device.name, 350)) {
        addRel(person.id, device.id, 'owns', 'Owns Device', false, 4);
      }
    });
  });

  PoIs.forEach(person => {
    locations.forEach(loc => {
      if (coOccurs(rawText, person.name, loc.name, 350)) {
        addRel(person.id, loc.id, 'located_at', 'Located At', false, 2);
      }
    });
  });

  for (let i = 0; i < PoIs.length; i++) {
    for (let j = i + 1; j < PoIs.length; j++) {
      if (coOccurs(rawText, PoIs[i].name, PoIs[j].name, 500)) {
        addRel(PoIs[i].id, PoIs[j].id, 'communicated', 'Communication Link', true, 7);
      }
    }
  }

  devices.forEach(device => {
    ips.forEach(ip => {
      if (coOccurs(rawText, device.name, ip.name, 300)) {
        addRel(device.id, ip.id, 'connected_to', 'Network Connection', true, 6);
      }
    });
  });

  ips.forEach(ip => {
    domains.forEach(domain => {
      if (coOccurs(rawText, ip.name, domain.name, 300)) {
        addRel(ip.id, domain.id, 'hosts', 'Hosts Domain', true, 7);
      }
    });
  });

  for (let i = 0; i < domains.length; i++) {
    for (let j = i + 1; j < domains.length; j++) {
      if (coOccurs(rawText, domains[i].name, domains[j].name, 400)) {
        addRel(domains[i].id, domains[j].id, 'linked', 'Infrastructure Link', true, 6);
      }
    }
  }

  for (let i = 0; i < emails.length; i++) {
    for (let j = i + 1; j < emails.length; j++) {
      if (coOccurs(rawText, emails[i].name, emails[j].name, 400)) {
        addRel(emails[i].id, emails[j].id, 'communicated', 'Email Exchange', true, 8);
      }
    }
  }

  return relationships;
}

function coOccurs(text, term1, term2, maxDistance) {
  const idx1 = text.toLowerCase().indexOf(term1.toLowerCase());
  const idx2 = text.toLowerCase().indexOf(term2.toLowerCase());
  if (idx1 === -1 || idx2 === -1) return false;
  return Math.abs(idx1 - idx2) <= maxDistance;
}
