// ============================================================================
// NOCTIS INTELLIGENCE INVESTIGATION PLATFORM - RISK ENGINE (STUB)
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
 * Calculates threat and risk scores for all entities based on connection topology.
 * @param {Array} entities 
 * @param {Array} relationships 
 * @param {Object} behaviorProfiles 
 * @param {Array} anomalies 
 * @returns {Array} List of entities with calculated risk metrics
 */
export function calculateRiskScores(entities, relationships, behaviorProfiles = {}, anomalies = []) {
  return entities.map(entity => {
    const connections = relationships.filter(r => {
      const sid = typeof r.source === 'object' ? r.source.id : r.source;
      const tid = typeof r.target === 'object' ? r.target.id : r.target;
      return sid === entity.id || tid === entity.id;
    });
    
    const suspiciousConnections = connections.filter(r => r.suspicious);
    
    // Direct connection heuristics
    const degreeCentrality = Math.min(30, connections.length * 6);
    const suspiciousWeight = suspiciousConnections.length * 15;
    const typeBaseRisk = { person: 15, ip: 25, domain: 20, device: 10, email: 10 }[entity.type] || 5;
    
    const profile = behaviorProfiles[entity.id];
    const behaviorRisk = profile ? profile.behaviorScore * 0.25 : 0;
    
    const entAnomalies = anomalies.filter(a => a.affectedEntities && a.affectedEntities.includes(entity.id));
    const anomalyWeight = Math.min(25, entAnomalies.length * 8);

    let computedRisk = Math.min(100, Math.max(0, Math.round(
      degreeCentrality + suspiciousWeight + typeBaseRisk + behaviorRisk + anomalyWeight
    )));

    // Honor entity presets if already specified and higher
    const finalRisk = entity.risk ? Math.max(entity.risk, computedRisk) : computedRisk;

    const riskTrend = entAnomalies.length > 0 || finalRisk >= 70 ? 'ESCALATING' : (finalRisk < 35 ? 'DE_ESCALATING' : 'STABLE');

    const riskHistory = [
      Math.max(10, Math.round(finalRisk * 0.5)),
      Math.max(15, Math.round(finalRisk * 0.7)),
      Math.max(20, Math.round(finalRisk * 0.85)),
      finalRisk
    ];

    return { 
      ...entity, 
      risk: finalRisk, 
      connectionCount: connections.length, 
      suspiciousConnectionCount: suspiciousConnections.length,
      riskTrend,
      riskHistory
    };
  });
}

export function getRiskLevel(score) {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

export function getRiskColor(score) {
  if (score >= 80) return '#ff4545';
  if (score >= 60) return '#f85149';
  if (score >= 40) return '#e3b341';
  return '#3fb950';
}
