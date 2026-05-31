// ===== NOCTIS RELATIONSHIP MAPPING ENGINE =====
// Automatic relationship inference from co-occurrence and pattern analysis

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

  const persons = entities.filter(e => e.type === 'person');
  const emails = entities.filter(e => e.type === 'email');
  const phones = entities.filter(e => e.type === 'phone');
  const ips = entities.filter(e => e.type === 'ip');
  const domains = entities.filter(e => e.type === 'domain');
  const devices = entities.filter(e => e.type === 'device');
  const orgs = entities.filter(e => e.type === 'organization');
  const locations = entities.filter(e => e.type === 'location');

  // Person → Email (if email domain matches person context)
  persons.forEach(person => {
    emails.forEach(email => {
      if (coOccurs(rawText, person.name, email.name, 200)) {
        addRel(person.id, email.id, 'uses', 'Uses Email', false, 3);
      }
    });
  });

  // Person → Phone
  persons.forEach(person => {
    phones.forEach(phone => {
      if (coOccurs(rawText, person.name, phone.name, 200)) {
        addRel(person.id, phone.id, 'owns', 'Phone Owner', false, 3);
      }
    });
  });

  // Person → Device
  persons.forEach(person => {
    devices.forEach(device => {
      if (coOccurs(rawText, person.name, device.name, 300)) {
        addRel(person.id, device.id, 'owns', 'Owns Device', false, 4);
      }
    });
  });

  // Person → Organization
  persons.forEach(person => {
    orgs.forEach(org => {
      if (coOccurs(rawText, person.name, org.name, 300)) {
        addRel(person.id, org.id, 'employed_by', 'Associated With', false, 3);
      }
    });
  });

  // Person → Location
  persons.forEach(person => {
    locations.forEach(loc => {
      if (coOccurs(rawText, person.name, loc.name, 300)) {
        addRel(person.id, loc.id, 'located_at', 'Located At', false, 2);
      }
    });
  });

  // Person → Person (communication)
  for (let i = 0; i < persons.length; i++) {
    for (let j = i + 1; j < persons.length; j++) {
      if (coOccurs(rawText, persons[i].name, persons[j].name, 500)) {
        addRel(persons[i].id, persons[j].id, 'communicated', 'Communication Link', true, 7);
      }
    }
  }

  // Device → IP
  devices.forEach(device => {
    ips.forEach(ip => {
      if (coOccurs(rawText, device.name, ip.name, 300)) {
        addRel(device.id, ip.id, 'connected_to', 'Network Connection', true, 6);
      }
    });
  });

  // IP → Domain
  ips.forEach(ip => {
    domains.forEach(domain => {
      if (coOccurs(rawText, ip.name, domain.name, 300)) {
        addRel(ip.id, domain.id, 'hosts', 'Hosts Domain', true, 7);
      }
    });
  });

  // Domain → Domain (shared infrastructure)
  for (let i = 0; i < domains.length; i++) {
    for (let j = i + 1; j < domains.length; j++) {
      if (coOccurs(rawText, domains[i].name, domains[j].name, 400)) {
        addRel(domains[i].id, domains[j].id, 'linked', 'Infrastructure Link', true, 6);
      }
    }
  }

  // IP → Organization (hosting)
  ips.forEach(ip => {
    orgs.forEach(org => {
      if (coOccurs(rawText, ip.name, org.name, 300)) {
        addRel(ip.id, org.id, 'hosted_by', 'Hosted By', false, 4);
      }
    });
  });

  // Email → Email (communication)
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
