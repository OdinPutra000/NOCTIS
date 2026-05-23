// ============================================================================
// NOCTIS INTELLIGENCE INVESTIGATION PLATFORM - CLUSTER ENGINE (STUB)
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
 * Runs community detection and hub classification on case data using standard BFS.
 * @param {Array} entities 
 * @param {Array} relationships 
 * @returns {Object} Detected clusters, coordinators, and isolated nodes
 */
export function detectClusters(entities, relationships) {
  if (!entities || entities.length === 0) {
    return { clusters: [], hubs: [], isolatedEntities: [] };
  }

  const clusters = [];
  const visited = new Set();
  
  // Calculate adjacency list for graph traversal
  const adj = {};
  entities.forEach(e => { adj[e.id] = []; });
  
  relationships.forEach(r => {
    const sid = typeof r.source === 'object' ? r.source.id : r.source;
    const tid = typeof r.target === 'object' ? r.target.id : r.target;
    
    if (adj[sid] && adj[tid]) {
      adj[sid].push(tid);
      adj[tid].push(sid);
    }
  });

  // Find connected components
  entities.forEach(entity => {
    if (visited.has(entity.id)) return;
    
    const component = [];
    const queue = [entity.id];
    
    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      
      visited.add(current);
      component.push(current);
      
      (adj[current] || []).forEach(neighbor => {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      });
    }

    if (component.length >= 2) {
      const clusterEntities = component.map(id => entities.find(e => e.id === id)).filter(Boolean);
      const avgRisk = clusterEntities.reduce((sum, e) => sum + (e.risk || 0), 0) / clusterEntities.length;
      
      // Determine Hub node
      let hubId = component[0];
      let maxConnections = -1;
      component.forEach(id => {
        const degree = (adj[id] || []).length;
        if (degree > maxConnections) {
          maxConnections = degree;
          hubId = id;
        }
      });
      const hubName = entities.find(e => e.id === hubId)?.name || 'Unknown Hub';

      // Cell classification
      let classification = 'SUPPORT_NETWORK';
      if (clusterEntities.some(e => e.type === 'person') && clusterEntities.length >= 3) {
        classification = 'OPERATIONAL_CELL';
      } else if (clusterEntities.some(e => e.type === 'ip' || e.type === 'domain')) {
        classification = 'INFRASTRUCTURE_GROUP';
      }

      // Threat evaluation
      let threatLevel = 'LOW';
      if (avgRisk >= 70) threatLevel = 'CRITICAL';
      else if (avgRisk >= 50) threatLevel = 'HIGH';
      else if (avgRisk >= 30) threatLevel = 'MEDIUM';

      const name = `${classification.replace('_', ' ')} ${String.fromCharCode(65 + clusters.length)}`;

      clusters.push({
        id: `cluster_${clusters.length + 1}`,
        name,
        entities: component,
        size: component.length,
        hub: hubId,
        hubName,
        avgRisk: Math.round(avgRisk),
        suspiciousLinkRatio: 50,
        density: Math.round((component.length / entities.length) * 100),
        classification,
        threatLevel
      });
    }
  });

  const hubs = clusters.map(c => c.hub);
  const isolatedEntities = entities
    .filter(e => !relationships.some(r => {
      const sid = typeof r.source === 'object' ? r.source.id : r.source;
      const tid = typeof r.target === 'object' ? r.target.id : r.target;
      return sid === e.id || tid === e.id;
    }))
    .map(e => e.id);

  return {
    clusters: clusters.sort((a, b) => b.avgRisk - a.avgRisk),
    hubs,
    isolatedEntities
  };
}
