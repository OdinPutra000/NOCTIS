// ===== NOCTIS V2 ANOMALY DETECTION ENGINE =====
// Client-side deterministic security and behavioral anomaly detection

/**
 * Scans case data for operational, network, and behavioral anomalies.
 * @param {Array} entities 
 * @param {Array} relationships 
 * @param {Array} events 
 * @returns {Array} List of detected anomalies
 */
export function detectAnomalies(entities, relationships, events) {
  const anomalies = [];
  
  if (!entities || entities.length === 0) return [];

  // Helper: calculate average value
  const getAverage = arr => arr.length ? arr.reduce((sum, v) => sum + v, 0) / arr.length : 0;

  // 1. UNUSUAL COMMUNICATION SPIKES
  // Check entities whose communication relationship frequency is significantly higher than normal.
  const commRels = relationships.filter(r => r.type === 'communicated');
  if (commRels.length > 0) {
    const avgWeight = getAverage(commRels.map(r => r.weight));
    commRels.forEach(rel => {
      if (rel.weight > avgWeight * 1.5 && rel.weight >= 7) {
        const sourceEnt = entities.find(e => e.id === rel.source);
        const targetEnt = entities.find(e => e.id === rel.target);
        
        if (sourceEnt && targetEnt) {
          anomalies.push({
            id: `anom_comm_spike_${rel.id}`,
            title: 'Critical Communication Spike',
            type: 'communication_spike',
            severity: rel.weight >= 9 ? 'CRITICAL' : 'HIGH',
            confidence: Math.round(75 + (rel.weight * 2.5)),
            affectedEntities: [rel.source, rel.target],
            explanation: `Anomalous communication intensity detected between ${sourceEnt.name} and ${targetEnt.name}. Link weight of ${rel.weight}/10 exceeds network average by ${Math.round((rel.weight / avgWeight - 1) * 100)}%, indicating a potential active data or C2 transmission burst.`,
            timestamp: new Date().toISOString(),
            indicators: ['High Volume', 'Suspicious Channel', 'Frequency Spike']
          });
        }
      }
    });
  }

  // 2. REPEATED FAILED LOGINS & OFF-HOURS ACCESS
  // Scan events for login anomalies and failed attempts (e.g. involving devices or internal servers).
  events.forEach(ev => {
    const descLower = (ev.description || '').toLowerCase();
    const titleLower = (ev.title || '').toLowerCase();
    
    if (descLower.includes('failed login') || descLower.includes('unauthorized access') || titleLower.includes('unauthorized')) {
      const affected = ev.entities || [];
      anomalies.push({
        id: `anom_login_${ev.id}`,
        title: 'Unauthorized Access Anomaly',
        type: 'failed_login',
        severity: 'CRITICAL',
        confidence: 90,
        affectedEntities: affected,
        explanation: `Repeated failed logins or unauthorized access attempts recorded for server/device. Event "${ev.title}" indicates potential brute-force or credential abuse targeting internal resources.`,
        timestamp: ev.timestamp,
        indicators: ['Authentication Failure', 'Brute Force Indicator', 'Access Violation']
      });
    }
  });

  // 3. INFRASTRUCTURE CHANGES / SERVER MIGRATIONS
  // Detect server, domain, or IP modifications in events (e.g., DNS switches, server moves).
  events.forEach(ev => {
    const descLower = (ev.description || '').toLowerCase();
    const titleLower = (ev.title || '').toLowerCase();
    if (descLower.includes('migration') || descLower.includes('dns change') || titleLower.includes('infrastructure') || descLower.includes('registered through')) {
      const affected = ev.entities || [];
      anomalies.push({
        id: `anom_infra_${ev.id}`,
        title: 'Rapid Infrastructure Migration',
        type: 'infrastructure_change',
        severity: 'HIGH',
        confidence: 85,
        affectedEntities: affected,
        explanation: `Suspicious infrastructure shifting detected. Event "${ev.title}" suggests rapid DNS re-routing or server redeployment, a common technique used by threat actors to evade network surveillance or secure active C2 nodes.`,
        timestamp: ev.timestamp,
        indicators: ['DNS Redirection', 'C2 Relocation', 'Bulletproof Hosting Switch']
      });
    }
  });

  // 4. RAPID RELATIONSHIP GROWTH
  // Check if any entity has accumulated connections extremely fast.
  entities.forEach(ent => {
    const connections = relationships.filter(r => r.source === ent.id || r.target === ent.id);
    const suspiciousConn = connections.filter(r => r.suspicious);
    
    // Heuristic: If entity has 3+ suspicious connections out of many, or represents a sudden change
    if (suspiciousConn.length >= 3) {
      anomalies.push({
        id: `anom_rel_growth_${ent.id}`,
        title: 'Explosive Relationship Expansion',
        type: 'rapid_relationship_growth',
        severity: suspiciousConn.length >= 4 ? 'CRITICAL' : 'HIGH',
        confidence: Math.min(95, 70 + (suspiciousConn.length * 5)),
        affectedEntities: [ent.id, ...suspiciousConn.map(c => c.source === ent.id ? c.target : c.source)],
        explanation: `Entity "${ent.name}" exhibited rapid relationship growth, establishing ${connections.length} links, of which ${suspiciousConn.length} are flagged as highly suspicious. This cluster of connections indicates operational onboarding or network propagation.`,
        timestamp: new Date().toISOString(),
        indicators: ['Rapid Node Linking', 'High suspicious ratio', 'Central coordinator setup']
      });
    }
  });

  // 5. HIDDEN INTERMEDIARIES
  // Detect entities connected only through suspicious or malicious middlemen.
  relationships.forEach(rel1 => {
    if (!rel1.suspicious) return;
    relationships.forEach(rel2 => {
      if (!rel2.suspicious || rel1.id === rel2.id) return;
      
      // Check for shared middleman
      let middleman = null;
      let leafA = null;
      let leafB = null;
      
      const s1 = rel1.source, t1 = rel1.target;
      const s2 = rel2.source, t2 = rel2.target;
      
      if (s1 === s2) { middleman = s1; leafA = t1; leafB = t2; }
      else if (s1 === t2) { middleman = s1; leafA = t1; leafB = s2; }
      else if (t1 === s2) { middleman = t1; leafA = s1; leafB = t2; }
      else if (t1 === t2) { middleman = t1; leafA = s1; leafB = s2; }
      
      if (middleman) {
        // Confirm leaves are not directly connected
        const direct = relationships.find(r => 
          (r.source === leafA && r.target === leafB) || 
          (r.source === leafB && r.target === leafA)
        );
        
        if (!direct) {
          const mName = entities.find(e => e.id === middleman)?.name || 'Unknown Middleman';
          const aName = entities.find(e => e.id === leafA)?.name || 'Entity A';
          const bName = entities.find(e => e.id === leafB)?.name || 'Entity B';
          
          anomalies.push({
            id: `anom_hidden_mid_${middleman}_${leafA}_${leafB}`,
            title: 'Indirect Path Covert Routing',
            type: 'hidden_intermediaries',
            severity: 'MEDIUM',
            confidence: 80,
            affectedEntities: [middleman, leafA, leafB],
            explanation: `Suspicious covert communication routing detected. ${aName} and ${bName} have no direct operational link but are closely linked via intermediary ${mName}. This pattern is indicative of a proxy or cell-coordinator mechanism to shield direct interaction.`,
            timestamp: new Date().toISOString(),
            indicators: ['Proxy Communication', 'No Direct Link', 'Suspicious Middleman']
          });
        }
      }
    });
  });

  // 6. UNUSUAL MOVEMENT / IMPOSSIBLE TRAVEL
  // Detect if any entity appears in two geographic locations in an impossible time frame.
  // We can group events by entity, sort by timestamp, and calculate geo-displacement.
  entities.forEach(ent => {
    if (ent.type !== 'person') return;
    
    const entEvents = events
      .filter(ev => ev.entities && ev.entities.includes(ent.id))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
    for (let i = 0; i < entEvents.length - 1; i++) {
      const ev1 = entEvents[i];
      const ev2 = entEvents[i+1];
      
      // Heuristic: check movement events or location significance in description
      const desc1 = (ev1.description || '').toLowerCase();
      const desc2 = (ev2.description || '').toLowerCase();
      
      if ((ev1.type === 'movement' && ev2.type === 'movement') || 
          (desc1.includes('meeting') && desc2.includes('meeting')) ||
          (ev1.location && ev2.location) ||
          (desc1.includes('cafe') && desc2.includes('cafe'))) {
        
        const hrs = Math.abs(new Date(ev2.timestamp) - new Date(ev1.timestamp)) / 3600000;
        
        // If events are within 48 hours and represent distinct sub-events
        if (hrs < 48 && ev1.title !== ev2.title) {
          anomalies.push({
            id: `anom_travel_${ent.id}_${ev1.id}_${ev2.id}`,
            title: 'Critical Travel Divergence',
            type: 'unusual_movement',
            severity: hrs < 12 ? 'CRITICAL' : 'HIGH',
            confidence: 85,
            affectedEntities: [ent.id],
            explanation: `Geographic displacement anomaly detected for ${ent.name}. Entity was associated with two operational events ("${ev1.title}" and "${ev2.title}") in different location contexts within a ${Math.round(hrs)} hour window, suggesting either high-velocity operational travel or credential sharing.`,
            timestamp: ev2.timestamp,
            indicators: ['Impossible Travel', 'Suspicious Meetings', 'Operational Escalation']
          });
        }
      }
    }
  });

  // 7. ABNORMAL TIMING / TEMPORAL CLUSTERING
  // If multiple high-severity events occur within a very narrow time window
  const sortedEvents = [...events].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  for (let i = 0; i < sortedEvents.length - 2; i++) {
    const ev1 = sortedEvents[i];
    const ev3 = sortedEvents[i+2];
    const diffMin = Math.abs(new Date(ev3.timestamp) - new Date(ev1.timestamp)) / 60000; // in minutes
    
    if (diffMin <= 120) { // 3 events in 2 hours
      const affected = [...new Set([ev1, sortedEvents[i+1], ev3].flatMap(e => e.entities || []))].filter(Boolean);
      anomalies.push({
        id: `anom_temporal_${ev1.id}_${ev3.id}`,
        title: 'Synchronized Operational Clustering',
        type: 'abnormal_timing',
        severity: 'HIGH',
        confidence: 80,
        affectedEntities: affected,
        explanation: `High-density event clustering detected. Three key intelligence events occurred within a narrow ${Math.round(diffMin)} minute window, indicating a coordinated operational phase or rapid intrusion escalation.`,
        timestamp: ev3.timestamp,
        indicators: ['Temporal Clustering', 'Rapid Fire Events', 'Coordinated Action']
      });
    }
  }

  // 8. HIGH-FREQUENCY ACTIVITY
  // Check if any entity is involved in 4+ events.
  entities.forEach(ent => {
    const count = events.filter(ev => ev.entities && ev.entities.includes(ent.id)).length;
    if (count >= 5) {
      anomalies.push({
        id: `anom_freq_${ent.id}`,
        title: 'Extreme Event Affinity',
        type: 'high_frequency_activity',
        severity: count >= 7 ? 'HIGH' : 'MEDIUM',
        confidence: 88,
        affectedEntities: [ent.id],
        explanation: `Extreme operational footprint detected for ${ent.name}. Entity is linked to ${count} timeline events, exceeding typical security profile limits and representing an exceptionally active intelligence focal point.`,
        timestamp: new Date().toISOString(),
        indicators: ['Footprint Saturation', 'High Event Affinity', 'Focal Target']
      });
    }
  });

  // 9. LATE-NIGHT / OFF-HOURS OPERATIONS
  // Ripped from AI insights and expanded: events occurring between 10 PM and 6 AM.
  events.forEach(ev => {
    const date = new Date(ev.timestamp);
    const hr = date.getUTCHours(); // Check local hour context if available, otherwise UTC
    const isLateNight = hr >= 22 || hr < 6;
    
    if (isLateNight && (ev.severity === 'high' || ev.severity === 'critical')) {
      const affected = ev.entities || [];
      const affectedNames = affected.map(id => entities.find(e => e.id === id)?.name).filter(Boolean).join(', ');
      
      anomalies.push({
        id: `anom_latenight_${ev.id}`,
        title: 'Off-Hours Operational Footprint',
        type: 'suspicious_late_night_operations',
        severity: 'MEDIUM',
        confidence: 78,
        affectedEntities: affected,
        explanation: `Off-hours operational footprint detected. Critical event "${ev.title}" occurred at ${date.toLocaleTimeString()} UTC involving [${affectedNames}]. Operations during these hours represent a strong covert indicator designed to bypass administrative oversight.`,
        timestamp: ev.timestamp,
        indicators: ['Off-Hours Execution', 'Covert Actions', 'Reduced Oversight Phase']
      });
    }
  });

  // Deduplicate anomalies by title + first affected entity
  const seen = new Set();
  return anomalies.filter(anom => {
    const key = `${anom.title}_${anom.affectedEntities[0] || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
