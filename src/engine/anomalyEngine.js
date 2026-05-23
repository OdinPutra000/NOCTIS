// ============================================================================
// NOCTIS INTELLIGENCE INVESTIGATION PLATFORM - ANOMALY ENGINE (STUB)
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
 * Scans case data for baseline operational anomalies.
 * @param {Array} entities 
 * @param {Array} relationships 
 * @param {Array} events 
 * @returns {Array} List of detected anomalies
 */
export function detectAnomalies(entities, relationships, events) {
  const anomalies = [];
  
  if (!entities || entities.length === 0) return [];

  // Helper to average weights
  const getAverage = arr => arr.length ? arr.reduce((sum, v) => sum + v, 0) / arr.length : 0;

  // 1. Basic Communication Spike
  const commRels = relationships.filter(r => r.type === 'communicated');
  if (commRels.length > 0) {
    const avgWeight = getAverage(commRels.map(r => r.weight));
    commRels.forEach(rel => {
      if (rel.weight > avgWeight * 1.3 && rel.weight >= 8) {
        const sourceEnt = entities.find(e => e.id === rel.source);
        const targetEnt = entities.find(e => e.id === rel.target);
        
        if (sourceEnt && targetEnt) {
          anomalies.push({
            id: `anom_comm_spike_${rel.id}`,
            title: 'Critical Communication Spike',
            type: 'communication_spike',
            severity: 'HIGH',
            confidence: 80,
            affectedEntities: [rel.source, rel.target],
            explanation: `Anomalous communication intensity detected between ${sourceEnt.name} and ${targetEnt.name}. Link weight is high (${rel.weight}/10), exceeding network normal.`,
            timestamp: new Date().toISOString(),
            indicators: ['High Volume', 'Frequency Spike']
          });
        }
      }
    });
  }

  // 2. Unauthorized Access Events
  events.forEach(ev => {
    const descLower = (ev.description || '').toLowerCase();
    const titleLower = (ev.title || '').toLowerCase();
    
    if (descLower.includes('failed login') || descLower.includes('unauthorized') || titleLower.includes('unauthorized')) {
      anomalies.push({
        id: `anom_login_${ev.id}`,
        title: 'Unauthorized Access Anomaly',
        type: 'failed_login',
        severity: 'CRITICAL',
        confidence: 90,
        affectedEntities: ev.entities || [],
        explanation: `Potential unauthorized access attempt flagged by event "${ev.title}".`,
        timestamp: ev.timestamp,
        indicators: ['Authentication Failure', 'Access Violation']
      });
    }
  });

  // 3. Coordinated Activity Clusters
  entities.forEach(ent => {
    const connections = relationships.filter(r => r.source === ent.id || r.target === ent.id);
    const suspiciousConn = connections.filter(r => r.suspicious);
    
    if (suspiciousConn.length >= 3) {
      anomalies.push({
        id: `anom_rel_growth_${ent.id}`,
        title: 'Explosive Relationship Expansion',
        type: 'rapid_relationship_growth',
        severity: 'HIGH',
        confidence: 85,
        affectedEntities: [ent.id, ...suspiciousConn.map(c => c.source === ent.id ? c.target : c.source)],
        explanation: `Entity "${ent.name}" exhibited rapid relationship growth establishing multiple suspicious connections.`,
        timestamp: new Date().toISOString(),
        indicators: ['Rapid Node Linking', 'Central coordinator setup']
      });
    }
  });

  // 4. Off-Hours Operations
  events.forEach(ev => {
    const date = new Date(ev.timestamp);
    const hr = date.getUTCHours();
    const isLateNight = hr >= 22 || hr < 6;
    
    if (isLateNight && (ev.severity === 'high' || ev.severity === 'critical')) {
      anomalies.push({
        id: `anom_latenight_${ev.id}`,
        title: 'Off-Hours Operational Footprint',
        type: 'suspicious_late_night_operations',
        severity: 'MEDIUM',
        confidence: 75,
        affectedEntities: ev.entities || [],
        explanation: `High-severity operational event "${ev.title}" occurred during off-hours (${hr}:00 UTC).`,
        timestamp: ev.timestamp,
        indicators: ['Off-Hours Execution', 'Reduced Oversight']
      });
    }
  });

  // Deduplicate
  const seen = new Set();
  return anomalies.filter(anom => {
    const key = `${anom.title}_${anom.affectedEntities[0] || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
