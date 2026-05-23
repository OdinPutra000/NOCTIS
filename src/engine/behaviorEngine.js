// ============================================================================
// NOCTIS INTELLIGENCE INVESTIGATION PLATFORM - BEHAVIOR ENGINE (STUB)
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
 * Generates simplified behavioral profiles and scores for all entities.
 * @param {Array} entities 
 * @param {Array} relationships 
 * @param {Array} events 
 * @param {Array} anomalies 
 * @returns {Object} Mapping of entityId -> behavioral profile
 */
export function analyzeBehavior(entities, relationships, events, anomalies = []) {
  const profiles = {};

  if (!entities || entities.length === 0) return {};

  entities.forEach(entity => {
    const conns = relationships.filter(r => r.source === entity.id || r.target === entity.id);
    const entEvents = events.filter(ev => ev.entities && ev.entities.includes(entity.id));
    const entAnomalies = anomalies.filter(an => an.affectedEntities && an.affectedEntities.includes(entity.id));

    // Simple, realistic score math
    const commScore = conns.length > 0 ? Math.min(100, conns.length * 15) : 30;
    const timingScore = entEvents.length > 0 ? Math.min(100, entEvents.length * 20) : 10;
    const locationScore = entity.type === 'location' ? 90 : (entEvents.length > 1 ? 50 : 20);
    const infraScore = ['ip', 'domain', 'device'].includes(entity.type) ? 80 : 30;
    const relScore = conns.filter(r => r.suspicious).length > 0 ? 85 : 40;
    const routineScore = entity.risk || 50;

    let behaviorScore = Math.round(
      (commScore + timingScore + locationScore + infraScore + relScore + routineScore) / 6
    );

    // Apply baseline modifiers
    if (entAnomalies.length > 0) behaviorScore = Math.min(100, behaviorScore + 15);
    if (entity.risk) behaviorScore = Math.max(behaviorScore, entity.risk);

    const trend = entAnomalies.length > 0 || behaviorScore >= 70 ? 'ESCALATING' : (behaviorScore < 35 ? 'DE_ESCALATING' : 'STABLE');

    const behaviorFlags = [];
    if (entEvents.length > 3) behaviorFlags.push('HIGH_ACTIVITY_DENSITY');
    if (conns.filter(r => r.suspicious).length > 0) behaviorFlags.push('HIGH_SUSPICIOUS_COMM');
    if (entAnomalies.length > 0) behaviorFlags.push('ACCUMULATED_ANOMALIES');
    if (conns.length > 4) behaviorFlags.push('HIGH_CONNECTIVITY_HUB');

    let assessment = '';
    if (behaviorScore >= 75) {
      assessment = `Critical threat pattern. Subject exhibits high behavioral divergence (${behaviorScore}/100) with an ${trend.toLowerCase()} trend. Direct operational containment and deep tracking advised.`;
    } else if (behaviorScore >= 50) {
      assessment = `Elevated operational risk. Active participation in network changes or shared infrastructure observed. Standard surveillance recommended.`;
    } else {
      assessment = `Normal behavioral profile. Patterns align with standard system baselines.`;
    }

    profiles[entity.id] = {
      entityId: entity.id,
      name: entity.name,
      type: entity.type,
      behaviorScore,
      dimensions: {
        communicationFrequency: Math.round(commScore),
        activityTiming: Math.round(timingScore),
        locationChanges: Math.round(locationScore),
        infrastructureUsage: Math.round(infraScore),
        relationshipEvolution: Math.round(relScore),
        operationalRoutines: Math.round(routineScore)
      },
      behaviorFlags,
      trend,
      assessment
    };
  });

  return profiles;
}
