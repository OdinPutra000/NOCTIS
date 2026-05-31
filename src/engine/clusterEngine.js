// ===== NOCTIS V2 CLUSTER DETECTION ENGINE =====
// Client-side community detection, hub finding, and cell classification

/**
 * Runs community detection and hub classification on case data.
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
  
  // Calculate adjacency list for BFS traversal
  const adj = {};
  entities.forEach(e => { adj[e.id] = []; });
  
  relationships.forEach(r => {
    // Standardize source/target IDs in case D3 has converted them to objects
    const sid = typeof r.source === 'object' ? r.source.id : r.source;
    const tid = typeof r.target === 'object' ? r.target.id : r.target;
    
    if (adj[sid] && adj[tid]) {
      adj[sid].push(tid);
      adj[tid].push(sid);
    }
  });

  // 1. DENSE COMMUNITY RESOLUTION (BFS connected components)
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

    // Only classify components of size >= 2 as active clusters
    if (component.length >= 2) {
      const clusterEntities = component.map(id => entities.find(e => e.id === id)).filter(Boolean);
      
      // Calculate average risk
      const avgRisk = clusterEntities.reduce((sum, e) => sum + (e.risk || 0), 0) / clusterEntities.length;
      
      // Get internal relationships
      const innerRels = relationships.filter(r => {
        const sid = typeof r.source === 'object' ? r.source.id : r.source;
        const tid = typeof r.target === 'object' ? r.target.id : r.target;
        return component.includes(sid) && component.includes(tid);
      });

      const suspRels = innerRels.filter(r => r.suspicious);
      const suspRatio = innerRels.length > 0 ? suspRels.length / innerRels.length : 0;

      // Calculate graph density: actual edges / potential edges
      const n = component.length;
      const potential = (n * (n - 1)) / 2;
      const density = potential > 0 ? innerRels.length / potential : 1;

      // FIND CENTRAL COORDINATOR (Hub)
      // Node in component with highest degree centrality (connections inside cluster)
      let hubId = component[0];
      let maxConnections = -1;
      
      component.forEach(id => {
        const degree = (adj[id] || []).filter(neigh => component.includes(neigh)).length;
        if (degree > maxConnections) {
          maxConnections = degree;
          hubId = id;
        }
      });
      
      const hubName = entities.find(e => e.id === hubId)?.name || 'Unknown Hub';

      // DETERMINE CELL CLASSIFICATION
      let classification = 'SUPPORT_NETWORK';
      const hasIP = clusterEntities.some(e => e.type === 'ip');
      const hasDomain = clusterEntities.some(e => e.type === 'domain');
      const hasPerson = clusterEntities.some(e => e.type === 'person');
      const hasComm = innerRels.some(r => r.type === 'communicated');

      if (hasPerson && hasComm && innerRels.length >= 4) {
        classification = 'OPERATIONAL_CELL';
      } else if (hasIP || hasDomain) {
        classification = 'INFRASTRUCTURE_GROUP';
      } else if (hasComm) {
        classification = 'COMMUNICATION_CLUSTER';
      }

      // THREAT LEVEL ASSESSMENT
      let threatLevel = 'LOW';
      if (avgRisk >= 75 || suspRatio >= 0.7) threatLevel = 'CRITICAL';
      else if (avgRisk >= 55 || suspRatio >= 0.5) threatLevel = 'HIGH';
      else if (avgRisk >= 35 || suspRatio >= 0.3) threatLevel = 'MEDIUM';

      // Generate a cohesive military-grade name
      const name = `${classification.replace('_', ' ')} ${String.fromCharCode(65 + clusters.length)}`;

      clusters.push({
        id: `cluster_${clusters.length + 1}`,
        name,
        entities: component,
        size: component.length,
        hub: hubId,
        hubName,
        avgRisk: Math.round(avgRisk),
        suspiciousLinkRatio: Math.round(suspRatio * 100),
        density: Math.round(density * 100),
        classification,
        threatLevel
      });
    }
  });

  // 2. EXTRACT HUBS & ISOLATED NODES
  const hubs = clusters.map(c => c.hub);
  const isolatedEntities = entities
    .filter(e => !relationships.some(r => {
      const sid = typeof r.source === 'object' ? r.source.id : r.source;
      const tid = typeof r.target === 'object' ? r.target.id : r.target;
      return sid === e.id || tid === e.id;
    }))
    .map(e => e.id);

  return {
    clusters: clusters.sort((a, b) => b.avgRisk - a.avgRisk), // sort by danger
    hubs,
    isolatedEntities
  };
}
