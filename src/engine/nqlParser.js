// ===== NOCTIS QUERY LANGUAGE (NQL) PARSER =====

export function parseNQL(command, entities, relationships, events, v2Context) {
  const tokens = command.trim().split(/\s+/);
  const cmd = tokens[0]?.toUpperCase();

  switch (cmd) {
    case 'START':
      if (tokens[1]?.toUpperCase() === 'INVESTIGATION') {
        return { type: 'investigation_command', action: 'start', text: 'Initializing Guided Investigation Pipeline...' };
      }
      return { type: 'error', text: 'Unknown START command. Available: START investigation' };
    case 'TRACE':
      if (tokens[1]?.toUpperCase() === 'ESCALATION_CHAIN') {
        return handleTraceEscalationChain(tokens, entities, v2Context);
      }
      return handleTrace(tokens, entities, relationships);
    case 'SHOW':
      if (tokens[1]?.toUpperCase() === 'FINDINGS') {
        return { type: 'investigation_command', action: 'show_findings', text: 'Displaying investigation scorecard and recommendations.' };
      }
      if (tokens[1]?.toUpperCase() === 'SUSPICIOUS_CLUSTERS' || tokens[1]?.toUpperCase() === 'CLUSTERS') {
        return handleShowClusters(v2Context);
      }
      return handleShow(tokens, entities, relationships);
    case 'SCAN':
      if (tokens[1]?.toUpperCase() === 'ANOMALIES' || !tokens[1]) {
        return handleScanAnomalies(v2Context);
      }
      return handleScan(tokens, entities, relationships, events);
    case 'ANALYZE':
      if (tokens[1]?.toUpperCase() === 'BEHAVIOR') {
        return handleAnalyzeBehavior(tokens, entities, v2Context);
      }
      return { type: 'error', data: 'Usage: ANALYZE behavior <entity_name>' };
    case 'DETECT':
      if (tokens[1]?.toUpperCase() === 'OPERATIONAL_PATTERNS' || tokens[1]?.toUpperCase() === 'PATTERNS' || !tokens[1]) {
        return handleDetectPatterns(v2Context);
      }
      return { type: 'error', data: 'Usage: DETECT operational_patterns' };
    case 'GENERATE':
      return handleGenerate(tokens, entities, relationships, events);
    case 'PREDICT':
      return handlePredict(tokens, entities, relationships, events);
    case 'FIND':
      return handleFind(tokens, entities);
    case 'HELP':
      return { type: 'help', data: getHelp() };
    default:
      return { type: 'error', data: `Unknown command: ${cmd}. Type HELP for available commands.` };
  }
}

function handleTrace(tokens, entities, relationships) {
  const name = tokens[1];
  const depthIdx = tokens.indexOf('depth');
  const depth = depthIdx !== -1 ? parseInt(tokens[depthIdx + 1]) || 2 : 2;
  
  if (!name) return { type: 'error', data: 'Usage: TRACE <entity_name> [depth <n>]' };
  
  const entity = entities.find(e => e.name.toLowerCase().includes(name.toLowerCase()));
  if (!entity) return { type: 'error', data: `Entity "${name}" not found.` };

  const traced = traceEntity(entity.id, relationships, entities, depth);
  return {
    type: 'trace',
    data: {
      root: entity,
      depth,
      nodes: traced.nodes,
      edges: traced.edges,
      message: `Traced ${entity.name} to depth ${depth}: Found ${traced.nodes.length} connected entities.`,
    }
  };
}

function traceEntity(rootId, relationships, entities, maxDepth) {
  const visited = new Set([rootId]);
  const nodes = [entities.find(e => e.id === rootId)];
  const edges = [];
  let frontier = [rootId];

  for (let d = 0; d < maxDepth; d++) {
    const nextFrontier = [];
    frontier.forEach(nodeId => {
      relationships.forEach(r => {
        let neighbor = null;
        if (r.source === nodeId && !visited.has(r.target)) neighbor = r.target;
        if (r.target === nodeId && !visited.has(r.source)) neighbor = r.source;
        if (neighbor) {
          visited.add(neighbor);
          nextFrontier.push(neighbor);
          const ent = entities.find(e => e.id === neighbor);
          if (ent) nodes.push(ent);
          edges.push(r);
        }
      });
    });
    frontier = nextFrontier;
  }

  return { nodes: nodes.filter(Boolean), edges };
}

function handleShow(tokens, entities, relationships) {
  const target = tokens.slice(1).join('_').toLowerCase();
  
  switch (target) {
    case 'suspicious_entities':
    case 'suspicious': {
      const suspicious = entities.filter(e => e.risk >= 70).sort((a, b) => b.risk - a.risk);
      return { type: 'list', data: { title: 'Suspicious Entities', items: suspicious, message: `Found ${suspicious.length} suspicious entities (risk ≥ 70).` } };
    }
    case 'all':
    case 'entities': {
      return { type: 'list', data: { title: 'All Entities', items: entities, message: `${entities.length} total entities in investigation.` } };
    }
    case 'relationships':
    case 'connections': {
      const susp = relationships.filter(r => r.suspicious);
      return { type: 'info', data: `${relationships.length} relationships total, ${susp.length} suspicious.` };
    }
    default:
      return { type: 'error', data: `Unknown target: ${target}. Try: suspicious_entities, all, relationships` };
  }
}

function handleScanAnomalies(v2Context) {
  const anomaliesList = v2Context?.anomalies || [];
  return {
    type: 'anomalies_list',
    data: {
      title: 'ANOMALY SCAN REPORT',
      items: anomaliesList,
      message: `Found ${anomaliesList.length} operational anomalies in behavioral data.`
    }
  };
}

function handleScan(tokens, entities, relationships, events) {
  const target = tokens[1]?.toLowerCase() || 'anomalies';
  
  if (target === 'anomalies') {
    const anomalies = [];
    const highRisk = entities.filter(e => e.risk >= 80);
    if (highRisk.length > 0) anomalies.push(`CRITICAL: ${highRisk.length} entities with risk ≥ 80`);
    
    const suspRels = relationships.filter(r => r.suspicious);
    if (suspRels.length > 0) anomalies.push(`WARNING: ${suspRels.length} suspicious relationships detected`);
    
    const ratio = relationships.length > 0 ? (suspRels.length / relationships.length * 100).toFixed(1) : 0;
    anomalies.push(`INFO: Suspicious link ratio: ${ratio}%`);
    
    return { type: 'scan', data: { title: 'Anomaly Scan Results', items: anomalies, count: anomalies.length } };
  }
  
  return { type: 'error', data: 'Usage: SCAN anomalies' };
}

function handleAnalyzeBehavior(tokens, entities, v2Context) {
  const name = tokens.slice(2).join(' ').trim();
  if (!name) return { type: 'error', data: 'Usage: ANALYZE behavior <entity_name>' };

  const entity = entities.find(e => e.name.toLowerCase().includes(name.toLowerCase()));
  if (!entity) return { type: 'error', data: `Entity "${name}" not found.` };

  const behaviorProfiles = v2Context?.behaviorProfiles || {};
  const profile = behaviorProfiles[entity.id];

  if (!profile) {
    return {
      type: 'error',
      data: `No behavioral profile found for entity "${entity.name}" (${entity.id}).`
    };
  }

  return {
    type: 'behavior_profile',
    data: {
      entity,
      profile
    }
  };
}

function handleShowClusters(v2Context) {
  const clustersList = v2Context?.clusters || [];
  return {
    type: 'clusters_list',
    data: {
      title: 'DETECTED OPERATIONAL CLUSTERS',
      clusters: clustersList,
      message: `Found ${clustersList.length} coordinated cluster structures.`
    }
  };
}

function handleDetectPatterns(v2Context) {
  const patternsList = v2Context?.operationalPatterns || [];
  return {
    type: 'patterns_list',
    data: {
      title: 'OPERATIONAL THREAT PATTERNS',
      patterns: patternsList,
      message: `Detected ${patternsList.length} structural network patterns.`
    }
  };
}

function handleTraceEscalationChain(tokens, entities, v2Context) {
  const name = tokens.slice(2).join(' ').trim();
  if (!name) return { type: 'error', data: 'Usage: TRACE escalation_chain <entity_name>' };

  const entity = entities.find(e => e.name.toLowerCase().includes(name.toLowerCase()));
  if (!entity) return { type: 'error', data: `Entity "${name}" not found.` };

  const timelineIntelligence = v2Context?.timelineIntelligence || {};
  const escalations = timelineIntelligence.escalations || [];

  // Find escalations linked to this entity
  const entityEscalations = escalations.filter(esc => esc.entityId === entity.id);

  return {
    type: 'escalation_chain',
    data: {
      entity,
      escalations: entityEscalations,
      riskHistory: entity.riskHistory || [],
      riskTrend: entity.riskTrend || 'STABLE'
    }
  };
}

function handleGenerate(tokens, entities, relationships, events) {
  const target = tokens.slice(1).join('_').toLowerCase();
  
  if (target === 'investigation_summary' || target === 'summary') {
    const persons = entities.filter(e => e.type === 'person');
    const highRisk = entities.filter(e => e.risk >= 70);
    const suspRels = relationships.filter(r => r.suspicious);
    
    const summary = [
      `=== INVESTIGATION SUMMARY ===`,
      `Total Entities: ${entities.length}`,
      `Total Relationships: ${relationships.length}`,
      `Suspicious Links: ${suspRels.length}`,
      `High-Risk Entities: ${highRisk.length}`,
      `Persons of Interest: ${persons.length}`,
      ``,
      `Top Threats:`,
      ...highRisk.slice(0, 5).map(e => `  → ${e.name} (${e.type}) — Risk: ${e.risk}`),
    ];
    
    return { type: 'summary', data: summary.join('\n') };
  }
  
  return { type: 'error', data: 'Usage: GENERATE investigation_summary' };
}

function handlePredict(tokens, entities, relationships, events) {
  const target = tokens[1]?.toLowerCase() || 'escalation';
  const suspRels = relationships.filter(r => r.suspicious);
  const highRisk = entities.filter(e => e.risk >= 70);
  
  const predictions = [
    { title: 'Communication Escalation', confidence: Math.min(95, 50 + highRisk.length * 5 + suspRels.length * 2) },
    { title: 'Infrastructure Reuse', confidence: Math.min(90, 40 + suspRels.length * 4) },
    { title: 'New Entity Emergence', confidence: Math.min(88, 45 + highRisk.length * 6) },
    { title: 'Operational Expansion', confidence: Math.min(85, 35 + entities.length * 2) },
  ];

  return {
    type: 'prediction',
    data: {
      title: 'Predictive Intelligence',
      predictions,
      message: `Generated ${predictions.length} predictions based on current intelligence.`
    }
  };
}

function handleFind(tokens, entities) {
  const query = tokens.slice(1).join(' ').toLowerCase();
  if (!query) return { type: 'error', data: 'Usage: FIND <query>' };
  
  const results = entities.filter(e => 
    e.name.toLowerCase().includes(query) || e.type.toLowerCase().includes(query)
  );
  
  return { type: 'list', data: { title: `Search: "${query}"`, items: results, message: `Found ${results.length} matching entities.` } };
}

function handleStart() {
  return { type: 'info', data: 'Investigation Pipeline Initialized: Analyzing multi-node correlation vectors...' };
}

function getHelp() {
  return [
    'NOCTIS Query Language (NQL) Commands:',
    '',
    '  START investigation            — Launch the guided investigation pipeline',
    '  TRACE <name> [depth <n>]       — Trace entity connections',
    '  TRACE escalation_chain <name>  — Show threat escalation history for an entity',
    '  SHOW suspicious_entities       — List high-risk entities',
    '  SHOW findings                  — Display investigation scorecard',
    '  SHOW suspicious_clusters       — Show detected network coordination cells',
    '  SHOW all                       — List all entities',
    '  SCAN anomalies                 — Scan for behavioral & network anomalies',
    '  DETECT operational_patterns     — Detect intelligence-grade patterns (Hub/Spoke, Chain, etc.)',
    '  ANALYZE behavior <name>        — Analyze 6-dimension behavior profile & flags',
    '  GENERATE summary               — Generate investigation summary',
    '  PREDICT escalation             — Predict future events',
    '  FIND <query>                   — Search entities by name or type',
    '  HELP                           — Show this help',
  ].join('\n');
}
