// ===== NOCTIS RISK SCORING ENGINE =====

export function calculateRiskScores(entities, relationships, behaviorProfiles = {}, anomalies = []) {
  return entities.map(entity => {
    const connections = relationships.filter(r => {
      const sid = typeof r.source === 'object' ? r.source.id : r.source;
      const tid = typeof r.target === 'object' ? r.target.id : r.target;
      return sid === entity.id || tid === entity.id;
    });
    
    const suspiciousConnections = connections.filter(r => r.suspicious);
    const totalWeight = connections.reduce((sum, r) => sum + r.weight, 0);
    const degreeCentrality = Math.min(25, connections.length * 4);
    const suspiciousRatio = connections.length > 0 ? (suspiciousConnections.length / connections.length) * 25 : 0;
    const weightIntensity = Math.min(15, (totalWeight / Math.max(1, connections.length)) * 2);
    const typeRisk = { person: 10, device: 8, ip: 12, domain: 14, location: 4, organization: 6, email: 10, phone: 8, event: 5 }[entity.type] || 5;
    
    // V2 Behavioral Metrics
    const profile = behaviorProfiles[entity.id];
    const behaviorWeight = profile ? profile.behaviorScore * 0.3 : 0;
    const entAnomalies = anomalies.filter(a => a.affectedEntities && a.affectedEntities.includes(entity.id));
    const anomalyWeight = Math.min(20, entAnomalies.length * 5);
    
    let computedRisk = Math.min(100, Math.max(0, Math.round(
      degreeCentrality + suspiciousRatio + weightIntensity + typeRisk + behaviorWeight + anomalyWeight
    )));

    // Preserve preset case risks if higher, or default to computed
    const finalRisk = entity.risk ? Math.max(entity.risk, computedRisk) : computedRisk;

    // Trend calculation
    let riskTrend = 'STABLE';
    if (entAnomalies.length > 0 || finalRisk >= 75) {
      riskTrend = 'ESCALATING';
    } else if (finalRisk < 30) {
      riskTrend = 'DE_ESCALATING';
    }

    // Historical progression (simulated trend history)
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

