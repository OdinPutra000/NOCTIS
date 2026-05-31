// ===== NOCTIS V2 RELATIONSHIP CONFIDENCE ENGINE =====
// Client-side trust scoring and evidence auditing for network links

/**
 * Evaluates relationship links and assigns trust, confidence, and evidence audits.
 * @param {Array} relationships 
 * @param {Array} entities 
 * @param {Array} events 
 * @returns {Object} Mapping of relationshipId -> confidence profiles
 */
export function calculateRelationshipConfidence(relationships, entities, events) {
  const confidenceProfiles = {};

  if (!relationships || relationships.length === 0) return {};

  relationships.forEach(rel => {
    const sourceEnt = entities.find(e => e.id === rel.source);
    const targetEnt = entities.find(e => e.id === rel.target);
    
    if (!sourceEnt || !targetEnt) return;

    // Baseline calculation based on weight (typically 1-10)
    let score = rel.weight * 7; // base weight multiplier (max 70)
    const evidence = [];

    // Audits and corroboration check
    // 1. Direct events referencing both entities
    const overlappingEvents = events.filter(ev => 
      ev.entities && 
      ev.entities.includes(rel.source) && 
      ev.entities.includes(rel.target)
    );

    if (overlappingEvents.length > 0) {
      score += Math.min(25, overlappingEvents.length * 8);
      evidence.push(`Corroborated by ${overlappingEvents.length} distinct timeline events`);
      evidence.push(`Event markers: ${overlappingEvents.slice(0, 2).map(e => `"${e.title}"`).join(', ')}`);
    }

    // 2. Temporal correlation (were they active at the same time?)
    const sEvents = events.filter(ev => ev.entities && ev.entities.includes(rel.source));
    const tEvents = events.filter(ev => ev.entities && ev.entities.includes(rel.target));
    let temporalOverlapCount = 0;
    
    sEvents.forEach(se => {
      tEvents.forEach(te => {
        const diffHrs = Math.abs(new Date(se.timestamp) - new Date(te.timestamp)) / 3600000;
        if (diffHrs <= 12) {
          temporalOverlapCount++;
        }
      });
    });

    if (temporalOverlapCount > 0) {
      score += Math.min(10, temporalOverlapCount * 2.5);
      evidence.push(`Temporal activity overlap detected within 12-hour windows (${temporalOverlapCount} instances)`);
    }

    // 3. Entity type affinity corroboration
    if (rel.type === 'owns' || rel.type === 'uses' || rel.type === 'belongs_to') {
      score += 15;
      evidence.push('Direct logical asset ownership relationship');
    } else if (rel.type === 'resolved' || rel.type === 'hosts' || rel.type === 'hosted_by') {
      score += 12;
      evidence.push('Direct DNS / host infrastructure mapping');
    } else if (rel.type === 'communicated' || rel.type === 'email_exchange' || rel.type === 'phone_comms') {
      score += 5;
      evidence.push(`Active network channel established (${rel.label})`);
    }

    // 4. Double check for high risk/critical nodes (adds focus weight)
    if (sourceEnt.risk >= 80 && targetEnt.risk >= 80) {
      score += 8;
      evidence.push('High-risk endpoint correlation');
    }

    // Adjusting weight constraints
    if (rel.suspicious) {
      score += 5;
      evidence.push('Flagged as operationally suspicious');
    }

    // Clamp score
    let confidence = Math.min(100, Math.max(15, Math.round(score)));

    // Determine trust levels
    let trustLevel = 'MODERATE';
    if (confidence >= 85) trustLevel = 'VERIFIED';
    else if (confidence >= 70) trustLevel = 'HIGH';
    else if (confidence >= 45) trustLevel = 'MODERATE';
    else if (confidence >= 25) trustLevel = 'LOW';
    else trustLevel = 'UNVERIFIED';

    // Evidence strength assessment
    let evidenceStrength = 'WEAK';
    if (overlappingEvents.length >= 2 || (rel.type === 'owns' && confidence >= 80)) {
      evidenceStrength = 'STRONG';
    } else if (overlappingEvents.length === 1 || confidence >= 60) {
      evidenceStrength = 'MODERATE';
    } else if (confidence >= 35) {
      evidenceStrength = 'WEAK';
    } else {
      evidenceStrength = 'CIRCUMSTANTIAL';
    }

    confidenceProfiles[rel.id] = {
      relationshipId: rel.id,
      sourceName: sourceEnt.name,
      targetName: targetEnt.name,
      type: rel.type,
      confidence,
      trustLevel,
      evidenceStrength,
      evidence
    };
  });

  return confidenceProfiles;
}
