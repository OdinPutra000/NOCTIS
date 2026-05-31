// ===== NOCTIS V2 BEHAVIORAL ANALYSIS ENGINE =====
// Client-side entity behavioral analytics over time

/**
 * Generates behavioral profiles and scores (0-100) for all entities.
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
    // 1. Get connections and communications
    const conns = relationships.filter(r => r.source === entity.id || r.target === entity.id);
    const comms = conns.filter(r => r.type === 'communicated');
    const infra = conns.filter(r => r.type === 'hosts' || r.type === 'hosted_by' || r.type === 'resolved' || r.type === 'connected_to' || r.type === 'accessed');
    
    // 2. Get events linked to entity
    const entEvents = events.filter(ev => ev.entities && ev.entities.includes(entity.id));
    
    // 3. Get anomalies linked to entity
    const entAnomalies = anomalies.filter(an => an.affectedEntities && an.affectedEntities.includes(entity.id));

    // DIMENSION 1: COMMUNICATION FREQUENCY (0 - 100)
    // Higher score means high volume of communications or suspicious comm channels
    let commScore = 0;
    if (comms.length > 0) {
      const totalCommWeight = comms.reduce((sum, r) => sum + r.weight, 0);
      const suspCommCount = comms.filter(r => r.suspicious).length;
      commScore = Math.min(100, (comms.length * 10) + (totalCommWeight * 3) + (suspCommCount * 25));
    } else if (entity.type === 'email' || entity.type === 'phone') {
      commScore = entity.risk || 40; // Default baseline risk if no links
    }

    // DIMENSION 2: ACTIVITY TIMING (0 - 100)
    // Penalize off-hours activity, late-night triggers
    let timingScore = 0;
    const lateNightEvents = entEvents.filter(ev => {
      const hr = new Date(ev.timestamp).getHours();
      return hr >= 22 || hr < 6;
    });
    if (entEvents.length > 0) {
      timingScore = Math.min(100, (lateNightEvents.length * 30) + (entEvents.length * 5));
    }

    // DIMENSION 3: LOCATION CHANGES (0 - 100)
    // Counts movement/geolocational displacement
    let locationScore = 0;
    const movementEvents = entEvents.filter(ev => ev.type === 'movement' || (ev.description || '').toLowerCase().includes('meeting') || (ev.description || '').toLowerCase().includes('travel'));
    const uniqueLocations = new Set(entEvents.map(ev => ev.location?.label).filter(Boolean));
    if (movementEvents.length > 0 || uniqueLocations.size > 1) {
      locationScore = Math.min(100, (movementEvents.length * 20) + (uniqueLocations.size * 15));
    }

    // DIMENSION 4: INFRASTRUCTURE USAGE (0 - 100)
    // Multiple IP/domain interactions or accessing servers
    let infraScore = 0;
    if (infra.length > 0) {
      const suspInfra = infra.filter(r => r.suspicious).length;
      infraScore = Math.min(100, (infra.length * 8) + (suspInfra * 25));
    } else if (entity.type === 'ip' || entity.type === 'domain') {
      infraScore = entity.risk || 50;
    }

    // DIMENSION 5: RELATIONSHIP EVOLUTION (0 - 100)
    // Evaluates how many connections are suspicious
    let relScore = 0;
    if (conns.length > 0) {
      const suspRatio = conns.filter(r => r.suspicious).length / conns.length;
      relScore = Math.min(100, Math.round((suspRatio * 70) + (conns.length * 3)));
    }

    // DIMENSION 6: OPERATIONAL ROUTINES (0 - 100)
    // Looks for structural risk: risk level, critical alerts, threat context
    let routineScore = Math.min(100, (entity.risk * 0.6) + (entAnomalies.length * 15));

    // AGGREGATE BEHAVIOR SCORE
    // Weighted formula based on entity type to be highly realistic
    let behaviorScore = 0;
    if (entity.type === 'person') {
      behaviorScore = Math.round(
        (commScore * 0.25) + 
        (timingScore * 0.20) + 
        (locationScore * 0.20) + 
        (infraScore * 0.15) + 
        (relScore * 0.10) + 
        (routineScore * 0.10)
      );
    } else if (entity.type === 'device') {
      behaviorScore = Math.round(
        (infraScore * 0.35) + 
        (timingScore * 0.25) + 
        (commScore * 0.10) + 
        (relScore * 0.15) + 
        (routineScore * 0.15)
      );
    } else if (entity.type === 'ip' || entity.type === 'domain') {
      behaviorScore = Math.round(
        (infraScore * 0.45) + 
        (commScore * 0.20) + 
        (relScore * 0.15) + 
        (routineScore * 0.20)
      );
    } else {
      // Default standard average
      behaviorScore = Math.round(
        (commScore * 0.15) + 
        (timingScore * 0.15) + 
        (locationScore * 0.15) + 
        (infraScore * 0.15) + 
        (relScore * 0.20) + 
        (routineScore * 0.20)
      );
    }

    // Clamping score
    behaviorScore = Math.min(100, Math.max(0, behaviorScore));

    // Trend assessment
    let trend = 'STABLE';
    if (entAnomalies.length > 0 || entEvents.filter(e => e.severity === 'critical').length > 0) {
      trend = 'ESCALATING';
    } else if (behaviorScore < 30) {
      trend = 'DE_ESCALATING';
    }

    // Generate behavioral flags
    const behaviorFlags = [];
    if (lateNightEvents.length > 0) behaviorFlags.push('MIDNIGHT_ACTIVITY');
    if (comms.filter(r => r.suspicious && r.weight >= 8).length > 0) behaviorFlags.push('HIGH_SUSPICIOUS_COMM');
    if (infra.filter(r => r.suspicious).length >= 2) behaviorFlags.push('INFRASTRUCTURE_REUSE');
    if (uniqueLocations.size >= 2) behaviorFlags.push('GEO_DIVERGENCE');
    if (entAnomalies.length >= 2) behaviorFlags.push('ACCUMULATED_ANOMALIES');
    if (conns.length > 5) behaviorFlags.push('HIGH_CONNECTIVITY_HUB');

    // Qualitative assessment
    let assessment = '';
    if (behaviorScore >= 80) {
      assessment = `Critical threat pattern. Entity exhibits high-frequency covert communications (${commScore} pts), abnormal activity timings (${timingScore} pts), and repeated links to known suspicious clusters. Direct monitoring and containment is highly recommended.`;
    } else if (behaviorScore >= 55) {
      assessment = `Elevated operational risk. Active participation in network changes or shared infrastructure observed. Timing anomalies and relationship links suggest coordinated operations requiring targeted surveillance.`;
    } else if (behaviorScore >= 30) {
      assessment = `Moderate behavioral footprints. Shows normal operations with standard communication baselines. Review of localized event interactions is advised.`;
    } else {
      assessment = `Entity shows low behavioral divergence. Patterns align with standard operational baselines.`;
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
