// ============================================================================
// NOCTIS INTELLIGENCE INVESTIGATION PLATFORM - PATTERN ENGINE (STUB)
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
 * Detects cyber threat and operational coordination topologies.
 * @param {Array} entities 
 * @param {Array} relationships 
 * @param {Array} events 
 * @returns {Array} List of detected operational signatures
 */
export function detectPatterns(entities, relationships, events) {
  const patterns = [];

  if (!entities || entities.length === 0) return [];

  // Helper adjacency maps
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

  // 1. HUB & SPOKE Topologies
  entities.forEach(ent => {
    const neighbors = adj[ent.id] || [];
    if (neighbors.length >= 3) {
      patterns.push({
        id: `pat_hub_spoke_${ent.id}`,
        type: 'hub_spoke',
        name: 'Hub & Spoke Distribution',
        description: `Structural distribution channel centered on coordinator "${ent.name}". It commands direct links to peripheral spoke entities with minimal horizontal communication.`,
        involvedEntities: [ent.id, ...neighbors],
        confidence: 85,
        severity: ent.risk >= 70 ? 'HIGH' : 'MEDIUM',
        visualHints: {
          highlightNodes: [ent.id, ...neighbors],
          highlightEdges: relationships.filter(r => {
            const sid = typeof r.source === 'object' ? r.source.id : r.source;
            const tid = typeof r.target === 'object' ? r.target.id : r.target;
            return (sid === ent.id && neighbors.includes(tid)) || (tid === ent.id && neighbors.includes(sid));
          }).map(r => r.id),
          layout: 'radial'
        }
      });
    }
  });

  // 2. INFRASTRUCTURE REUSE
  entities.forEach(infraNode => {
    if (infraNode.type !== 'ip' && infraNode.type !== 'domain') return;

    const linkedRels = relationships.filter(r => {
      const sid = typeof r.source === 'object' ? r.source.id : r.source;
      const tid = typeof r.target === 'object' ? r.target.id : r.target;
      return sid === infraNode.id || tid === infraNode.id;
    });

    const connectedSubjects = linkedRels.map(r => {
      const otherId = r.source === infraNode.id ? r.target : r.source;
      return entities.find(e => e.id === otherId);
    }).filter(Boolean);

    if (connectedSubjects.length >= 2) {
      patterns.push({
        id: `pat_infra_reuse_${infraNode.id}`,
        type: 'infrastructure_reuse',
        name: 'Infrastructure Asset Sharing',
        description: `Network asset reuse signature detected on "${infraNode.name}". Multiple endpoints share access pathways to this asset, indicating coordinated operations.`,
        involvedEntities: [infraNode.id, ...connectedSubjects.map(s => s.id)],
        confidence: 90,
        severity: 'HIGH',
        visualHints: {
          highlightNodes: [infraNode.id, ...connectedSubjects.map(s => s.id)],
          highlightEdges: linkedRels.map(r => r.id),
          layout: 'hub'
        }
      });
    }
  });

  // 3. CENTRALIZED CONTROL
  entities.forEach(ent => {
    const totalDegree = (adj[ent.id] || []).length;
    if (totalDegree >= 4 && ent.risk >= 60) {
      patterns.push({
        id: `pat_central_ctrl_${ent.id}`,
        type: 'centralized_control',
        name: 'Central Control Hub',
        description: `Centralized network control signature anchored at "${ent.name}". Driven by a high connectivity footprint spanning multiple network targets.`,
        involvedEntities: [ent.id, ...(adj[ent.id] || [])],
        confidence: 80,
        severity: 'CRITICAL',
        visualHints: {
          highlightNodes: [ent.id, ...(adj[ent.id] || [])],
          highlightEdges: relationships.filter(r => {
            const sid = typeof r.source === 'object' ? r.source.id : r.source;
            const tid = typeof r.target === 'object' ? r.target.id : r.target;
            return sid === ent.id || tid === ent.id;
          }).map(r => r.id),
          layout: 'radial'
        }
      });
    }
  });

  const seen = new Set();
  return patterns.filter(pat => {
    const key = `${pat.type}_${pat.involvedEntities[0] || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
