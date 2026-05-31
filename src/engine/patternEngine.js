// ===== NOCTIS V2 OPERATIONAL PATTERN ENGINE =====
// Client-side intelligence signature and threat topology recognition

/**
 * Detects complex cyber threat and operational coordination topologies.
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
  const inDegree = {};
  const outDegree = {};
  
  entities.forEach(e => {
    adj[e.id] = [];
    inDegree[e.id] = 0;
    outDegree[e.id] = 0;
  });

  relationships.forEach(r => {
    const sid = typeof r.source === 'object' ? r.source.id : r.source;
    const tid = typeof r.target === 'object' ? r.target.id : r.target;
    
    if (adj[sid] && adj[tid]) {
      adj[sid].push(tid);
      adj[tid].push(sid);
      outDegree[sid]++;
      inDegree[tid]++;
    }
  });

  // 1. HUB & SPOKE Topologies
  // A central coordinator connected to 4+ nodes, where spokes are poorly connected to each other
  entities.forEach(ent => {
    const neighbors = adj[ent.id] || [];
    if (neighbors.length >= 4) {
      // Check inter-connectivity between neighbors
      let innerLinksCount = 0;
      for (let i = 0; i < neighbors.length; i++) {
        for (let j = i + 1; j < neighbors.length; j++) {
          const connected = relationships.some(r => {
            const sid = typeof r.source === 'object' ? r.source.id : r.source;
            const tid = typeof r.target === 'object' ? r.target.id : r.target;
            return (sid === neighbors[i] && tid === neighbors[j]) || 
                   (sid === neighbors[j] && tid === neighbors[i]);
          });
          if (connected) innerLinksCount++;
        }
      }
      
      const potentialLinks = (neighbors.length * (neighbors.length - 1)) / 2;
      const spokeDensity = potentialLinks > 0 ? innerLinksCount / potentialLinks : 0;
      
      if (spokeDensity <= 0.25) { // Spokes are mostly isolated from each other
        const avgSpokeRisk = neighbors.reduce((sum, id) => sum + (entities.find(e => e.id === id)?.risk || 0), 0) / neighbors.length;
        
        patterns.push({
          id: `pat_hub_spoke_${ent.id}`,
          type: 'hub_spoke',
          name: 'Hub & Spoke Distribution',
          description: `Structural distribution channel centered on coordinator "${ent.name}". It commands direct links to ${neighbors.length} peripheral spoke entities with minimal horizontal communication, a classic topology for command-and-control shielding or compartmentalized tasks.`,
          involvedEntities: [ent.id, ...neighbors],
          confidence: Math.round(80 + (neighbors.length * 2) - (spokeDensity * 40)),
          severity: avgSpokeRisk >= 60 ? 'HIGH' : 'MEDIUM',
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
    }
  });

  // 2. CHAIN FLOW pathways
  // Linear sequences of connections A -> B -> C -> D
  entities.forEach(ent => {
    const nextList = adj[ent.id] || [];
    
    nextList.forEach(bId => {
      const bNext = adj[bId] || [];
      const cList = bNext.filter(id => id !== ent.id);
      
      cList.forEach(cId => {
        const cNext = adj[cId] || [];
        const dList = cNext.filter(id => id !== bId && id !== ent.id);
        
        dList.forEach(dId => {
          // Found A -> B -> C -> D
          const path = [ent.id, bId, cId, dId];
          const pathNames = path.map(id => entities.find(e => e.id === id)?.name || id).join(' ➔ ');
          
          patterns.push({
            id: `pat_chain_${ent.id}_${dId}`,
            type: 'chain_flow',
            name: 'Chain Flow Pathway',
            description: `Linear transmission flow detected: ${pathNames}. Information, crypto transfers, or operational actions are routed sequentially through multiple transit nodes, indicating high covert transmission planning to avoid direct endpoint links.`,
            involvedEntities: path,
            confidence: 85,
            severity: 'HIGH',
            visualHints: {
              highlightNodes: path,
              highlightEdges: relationships.filter(r => {
                const sid = typeof r.source === 'object' ? r.source.id : r.source;
                const tid = typeof r.target === 'object' ? r.target.id : r.target;
                return (sid === ent.id && tid === bId) || (sid === bId && tid === ent.id) ||
                       (sid === bId && tid === cId) || (sid === cId && tid === bId) ||
                       (sid === cId && tid === dId) || (sid === dId && tid === cId);
              }).map(r => r.id),
              layout: 'linear'
            }
          });
        });
      });
    });
  });

  // 3. COORDINATED COMMUNICATION Spikes
  // Timeline event where 3+ entities communicate in narrow windows (using events)
  const sortedEvents = [...events].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  for (let i = 0; i < sortedEvents.length - 2; i++) {
    const ev1 = sortedEvents[i];
    const ev3 = sortedEvents[i+2];
    const diff = Math.abs(new Date(ev3.timestamp) - new Date(ev1.timestamp));
    
    if (diff <= 6 * 3600 * 1000) { // 6 hour window
      const involved = [...new Set([ev1, sortedEvents[i+1], ev3].flatMap(e => e.entities || []))].filter(Boolean);
      const isComms = [ev1, sortedEvents[i+1], ev3].every(e => e.type === 'communication' || e.category === 'communication' || (e.description || '').toLowerCase().includes('call') || (e.description || '').toLowerCase().includes('email'));
      
      if (involved.length >= 3 && isComms) {
        const names = involved.map(id => entities.find(e => e.id === id)?.name || id).join(', ');
        patterns.push({
          id: `pat_coord_comm_${ev1.id}_${ev3.id}`,
          type: 'coordinated_communication',
          name: 'Coordinated Comms Spike',
          description: `Rapid-fire synchronized communication signature. Nodes [${names}] initiated successive encrypted channels within a ${Math.round(diff / 60000)} minute envelope, representing structured execution briefing or trigger coordination.`,
          involvedEntities: involved,
          confidence: 90,
          severity: 'CRITICAL',
          visualHints: {
            highlightNodes: involved,
            highlightEdges: relationships.filter(r => {
              const sid = typeof r.source === 'object' ? r.source.id : r.source;
              const tid = typeof r.target === 'object' ? r.target.id : r.target;
              return involved.includes(sid) && involved.includes(tid);
            }).map(r => r.id),
            layout: 'cluster'
          }
        });
      }
    }
  }

  // 4. INFRASTRUCTURE REUSE
  // Multiple distinct suspect entities sharing the exact same IP/Domain/Hosting resources
  entities.forEach(infraNode => {
    if (infraNode.type !== 'ip' && infraNode.type !== 'domain') return;

    const linkedRels = relationships.filter(r => {
      const sid = typeof r.source === 'object' ? r.source.id : r.source;
      const tid = typeof r.target === 'object' ? r.target.id : r.target;
      return sid === infraNode.id || tid === infraNode.id;
    });

    const connectedSubjects = linkedRels
      .map(r => {
        const otherId = r.source === infraNode.id ? r.target : r.source;
        return entities.find(e => e.id === otherId);
      })
      .filter(e => e && (e.type === 'person' || e.type === 'device' || e.risk >= 65));

    if (connectedSubjects.length >= 2) {
      patterns.push({
        id: `pat_infra_reuse_${infraNode.id}`,
        type: 'infrastructure_reuse',
        name: 'Infrastructure Asset Sharing',
        description: `Network multiplexing signature detected on "${infraNode.name}". Multiple threat endpoints and nodes share access pathways to this asset, confirming infrastructure reuse for synchronized operations, logging, or payload delivery.`,
        involvedEntities: [infraNode.id, ...connectedSubjects.map(s => s.id)],
        confidence: 95,
        severity: infraNode.risk >= 80 ? 'CRITICAL' : 'HIGH',
        visualHints: {
          highlightNodes: [infraNode.id, ...connectedSubjects.map(s => s.id)],
          highlightEdges: linkedRels.map(r => r.id),
          layout: 'hub'
        }
      });
    }
  });

  // 5. CENTRALIZED CONTROL
  // Single node with extremely high in-out degree control flow
  entities.forEach(ent => {
    const totalDegree = (adj[ent.id] || []).length;
    const isHighRisk = ent.risk >= 70;
    
    if (totalDegree >= 5 && isHighRisk) {
      patterns.push({
        id: `pat_central_ctrl_${ent.id}`,
        type: 'centralized_control',
        name: 'Central Control Hub',
        description: `Centralized network control signature anchored at "${ent.name}". With ${totalDegree} active connections spanning communications, network targets, and transit infrastructure, this entity acts as the primary coordinator driving network operations.`,
        involvedEntities: [ent.id, ...(adj[ent.id] || [])],
        confidence: 88,
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

  // 6. PROXY ENTITY USAGE
  // Intermediary connected strictly to two disjoint, high-threat zones
  entities.forEach(ent => {
    const conns = adj[ent.id] || [];
    if (conns.length === 2) {
      const e1 = entities.find(e => e.id === conns[0]);
      const e2 = entities.find(e => e.id === conns[1]);
      
      if (e1 && e2 && e1.risk >= 65 && e2.risk >= 65) {
        // Ensure e1 and e2 are NOT connected
        const areLinked = relationships.some(r => {
          const sid = typeof r.source === 'object' ? r.source.id : r.source;
          const tid = typeof r.target === 'object' ? r.target.id : r.target;
          return (sid === e1.id && tid === e2.id) || (sid === e2.id && tid === e1.id);
        });

        if (!areLinked) {
          patterns.push({
            id: `pat_proxy_${ent.id}`,
            type: 'proxy_usage',
            name: 'Proxy Intermediary Gateway',
            description: `Targeted gateway proxy topology detected. "${ent.name}" acts as a single bridge connecting two isolated threat endpoints (${e1.name} and ${e2.name}) with zero horizontal link paths, suggesting deliberate traffic proxying to shield endpoint interactions.`,
            involvedEntities: [ent.id, e1.id, e2.id],
            confidence: 82,
            severity: 'HIGH',
            visualHints: {
              highlightNodes: [ent.id, e1.id, e2.id],
              highlightEdges: relationships.filter(r => {
                const sid = typeof r.source === 'object' ? r.source.id : r.source;
                const tid = typeof r.target === 'object' ? r.target.id : r.target;
                return (sid === ent.id && (tid === e1.id || tid === e2.id)) ||
                       (tid === ent.id && (sid === e1.id || sid === e2.id));
              }).map(r => r.id),
              layout: 'linear'
            }
          });
        }
      }
    }
  });

  // 7. MULTI-NODE ESCALATION
  // Risk escalation trending up concurrently on 3+ connected nodes in timeline
  const poeList = entities.filter(e => e.risk >= 70);
  if (poeList.length >= 3) {
    const threatGroup = poeList.map(p => p.id);
    const names = poeList.map(p => p.name).join(', ');
    
    patterns.push({
      id: `pat_escalation_group`,
      type: 'multi_node_escalation',
      name: 'Coordinated Escalation Signature',
      description: `Synchronized threat escalation envelope. Distinct endpoints [${names}] connected to this operational cluster exhibited concurrent risk score elevation, indicating a network-wide offensive execution phase.`,
      involvedEntities: threatGroup,
      confidence: 80,
      severity: 'CRITICAL',
      visualHints: {
        highlightNodes: threatGroup,
        highlightEdges: relationships.filter(r => {
          const sid = typeof r.source === 'object' ? r.source.id : r.source;
          const tid = typeof r.target === 'object' ? r.target.id : r.target;
          return threatGroup.includes(sid) && threatGroup.includes(tid);
        }).map(r => r.id),
        layout: 'cluster'
      }
    });
  }

  // Deduplicate patterns by type + primary target
  const seen = new Set();
  return patterns.filter(pat => {
    const key = `${pat.type}_${pat.involvedEntities[0] || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
