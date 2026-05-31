import { create } from 'zustand';
import { SAMPLE_CASE } from '../data/sampleCase';
import { generateAIInsights } from '../engine/aiReasoning';
import { generateCaseScorecard, generateRecommendedActions, generateExecutiveSummary, generateStepInsight } from '../engine/investigationEngine';

const useStore = create((set, get) => ({
  // ===== CASE STATE =====
  activeCase: null,
  cases: [],
  caseName: '',
  caseType: 'Cyber Investigation',

  // ===== ENTITIES & RELATIONSHIPS =====
  entities: [],
  relationships: [],
  events: [],
  rawIntelligence: '',

  // ===== UI STATE =====
  activeView: 'graph',
  selectedEntity: null,
  rightPanelTab: 'details',
  nqlOpen: false,
  nqlHistory: [],

  // ===== ENTITY FILTERS =====
  entityFilters: {
    person: true,
    device: true,
    email: true,
    phone: true,
    ip: true,
    domain: true,
    location: true,
    organization: true,
    event: true,
  },

  // ===== GRAPH STATE =====
  graphLocked: false,
  graphSearchQuery: '',
  highlightedNodeIds: [],
  highlightedEdgeIds: [],
  shortestPathActive: false,
  shortestPathNodes: [],
  shortestPathResult: [],
  clusterHighlightType: null,
  graphLayoutVersion: 0,

  // ===== ANALYSIS STATE =====
  analysisRunning: false,
  analysisComplete: false,
  lastAnalysisTime: null,
  investigationSteps: [
    { id: 'ingestion', name: 'Data Ingestion', status: 'pending', progress: 0 },
    { id: 'mapping', name: 'Entity Mapping', status: 'pending', progress: 0 },
    { id: 'relationships', name: 'Relationship Analysis', status: 'pending', progress: 0 },
    { id: 'patterns', name: 'Pattern Detection', status: 'pending', progress: 0 },
    { id: 'behavioral', name: 'Behavioral Analysis', status: 'pending', progress: 0 },
    { id: 'reasoning', name: 'AI Reasoning', status: 'pending', progress: 0 },
    { id: 'recommendation', name: 'Operational Recommendation', status: 'pending', progress: 0 },
  ],

  // ===== AI INSIGHTS =====
  aiInsights: null,
  patterns: [],
  predictions: [],

  // ===== BEHAVIORAL INTELLIGENCE STATE (V2) =====
  anomalies: [],
  behaviorProfiles: {},
  relationshipConfidence: {},
  clusters: [],
  timelineIntelligence: null,
  operationalPatterns: [],
  selectedCluster: null,
  graphOverlay: 'none', // 'none' | 'behavior_heat' | 'confidence' | 'clusters'
  timelineMode: 'standard', // 'standard' | 'density' | 'heat'

  // ===== INVESTIGATION MODE STATE =====
  investigationModeOpen: false,
  investigationPhase: 0,
  investigationHistory: [],
  investigationFindings: [],
  investigationRecommendations: [],
  investigationCaseSummary: null,
  investigationScorecard: null,
  investigationOfficerMessages: [],


  // ===== ACTIONS =====
  setActiveView: (view) => set({ activeView: view }),
  setSelectedEntity: (entity) => set({ selectedEntity: entity, rightPanelTab: 'details' }),
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
  setCaseName: (name) => set({ caseName: name }),
  setCaseType: (type) => set({ caseType: type }),
  setRawIntelligence: (text) => set({ rawIntelligence: text }),
  toggleNQL: () => set((s) => ({ nqlOpen: !s.nqlOpen })),
  addNQLHistory: (cmd) => set((s) => ({ nqlHistory: [...s.nqlHistory, cmd] })),

  // ===== V2 ACTIONS =====
  setGraphOverlay: (overlay) => set({ graphOverlay: overlay }),
  setTimelineMode: (mode) => set({ timelineMode: mode }),

  // ===== INVESTIGATION MODE ACTIONS =====
  toggleInvestigationMode: () => set((s) => ({ investigationModeOpen: !s.investigationModeOpen })),
  openInvestigationMode: () => set({ investigationModeOpen: true }),
  closeInvestigationMode: () => set({ investigationModeOpen: false }),
  setInvestigationPhase: (phase) => {
    const { entities, relationships, anomalies, behaviorProfiles, operationalPatterns, clusters, aiInsights, rawIntelligence } = get();
    const storeSnapshot = { entities, relationships, anomalies, behaviorProfiles, operationalPatterns, clusters, aiInsights, rawIntelligence };
    const insight = generateStepInsight(phase, storeSnapshot);
    const officerMsg = {
      id: `officer_${Date.now()}`,
      timestamp: new Date().toISOString(),
      phase,
      stepTitle: insight.title,
      content: insight.explanation,
      type: 'phase_change',
    };
    set((s) => ({
      investigationPhase: phase,
      investigationOfficerMessages: [...s.investigationOfficerMessages, officerMsg],
      investigationHistory: [...s.investigationHistory, {
        step: phase,
        action: `Navigated to Step ${phase + 1}: ${insight.title}`,
        timestamp: new Date().toISOString(),
        details: insight.title,
      }],
    }));
  },
  advanceInvestigationPhase: () => {
    const { investigationPhase } = get();
    if (investigationPhase < 7) {
      get().setInvestigationPhase(investigationPhase + 1);
    }
  },
  resetInvestigation: () => set({
    investigationPhase: 0,
    investigationHistory: [],
    investigationFindings: [],
    investigationRecommendations: [],
    investigationCaseSummary: null,
    investigationScorecard: null,
    investigationOfficerMessages: [],
  }),
  addInvestigationFinding: (finding) => set((s) => ({
    investigationFindings: [...s.investigationFindings, { ...finding, timestamp: new Date().toISOString() }],
    investigationHistory: [...s.investigationHistory, {
      step: s.investigationPhase,
      action: `Finding discovered: ${finding.title || 'Unknown'}`,
      timestamp: new Date().toISOString(),
      details: finding.title,
    }],
  })),
  addOfficerMessage: (message) => set((s) => ({
    investigationOfficerMessages: [...s.investigationOfficerMessages, {
      id: `officer_${Date.now()}`,
      timestamp: new Date().toISOString(),
      content: message,
      type: 'insight',
    }],
  })),
  generateInvestigationSummary: () => {
    const { entities, relationships, anomalies, behaviorProfiles, operationalPatterns, clusters } = get();
    const scorecard = generateCaseScorecard(entities, relationships, anomalies, behaviorProfiles, clusters);
    const recommendations = generateRecommendedActions(entities, relationships, anomalies, operationalPatterns, clusters, behaviorProfiles);
    const summary = generateExecutiveSummary(entities, relationships, anomalies, operationalPatterns, clusters, behaviorProfiles);
    set({
      investigationScorecard: scorecard,
      investigationRecommendations: recommendations,
      investigationCaseSummary: summary,
    });
    return { scorecard, recommendations, summary };
  },
  selectCluster: (clusterId) => set({ selectedCluster: clusterId }),


  toggleEntityFilter: (type) => set((s) => ({
    entityFilters: { ...s.entityFilters, [type]: !s.entityFilters[type] }
  })),

  // ===== GRAPH ACTIONS =====
  toggleGraphLock: () => set((s) => ({ graphLocked: !s.graphLocked })),
  setGraphSearchQuery: (q) => set({ graphSearchQuery: q }),

  setHighlightedNodes: (ids) => set({ highlightedNodeIds: ids }),
  setHighlightedEdges: (ids) => set({ highlightedEdgeIds: ids }),
  clearHighlights: () => set({
    highlightedNodeIds: [],
    highlightedEdgeIds: [],
    shortestPathActive: false,
    shortestPathNodes: [],
    shortestPathResult: [],
    clusterHighlightType: null,
  }),

  toggleShortestPathMode: () => set((s) => ({
    shortestPathActive: !s.shortestPathActive,
    shortestPathNodes: [],
    shortestPathResult: [],
  })),

  addShortestPathNode: (nodeId) => {
    const { shortestPathNodes, entities, relationships, entityFilters } = get();
    if (shortestPathNodes.includes(nodeId)) return;
    const updated = [...shortestPathNodes, nodeId];
    if (updated.length === 2) {
      // BFS shortest path
      const filteredIds = new Set(entities.filter(e => entityFilters[e.type]).map(e => e.id));
      const adj = {};
      filteredIds.forEach(id => { adj[id] = []; });
      relationships.forEach(r => {
        const sid = typeof r.source === 'object' ? r.source.id : r.source;
        const tid = typeof r.target === 'object' ? r.target.id : r.target;
        if (filteredIds.has(sid) && filteredIds.has(tid)) {
          adj[sid].push(tid);
          adj[tid].push(sid);
        }
      });
      // BFS
      const queue = [updated[0]];
      const visited = new Set([updated[0]]);
      const parent = { [updated[0]]: null };
      let found = false;
      while (queue.length > 0) {
        const curr = queue.shift();
        if (curr === updated[1]) { found = true; break; }
        for (const neighbor of (adj[curr] || [])) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            parent[neighbor] = curr;
            queue.push(neighbor);
          }
        }
      }
      if (found) {
        const path = [];
        let node = updated[1];
        while (node !== null) { path.unshift(node); node = parent[node]; }
        // Find edge IDs on path
        const pathEdgeIds = [];
        for (let i = 0; i < path.length - 1; i++) {
          const a = path[i], b = path[i + 1];
          const edge = relationships.find(r => {
            const sid = typeof r.source === 'object' ? r.source.id : r.source;
            const tid = typeof r.target === 'object' ? r.target.id : r.target;
            return (sid === a && tid === b) || (sid === b && tid === a);
          });
          if (edge) pathEdgeIds.push(edge.id);
        }
        set({
          shortestPathNodes: updated,
          shortestPathResult: path,
          highlightedNodeIds: path,
          highlightedEdgeIds: pathEdgeIds,
        });
      } else {
        set({ shortestPathNodes: updated, shortestPathResult: [] });
      }
    } else {
      set({ shortestPathNodes: updated });
    }
  },

  highlightCluster: (type) => {
    const { entities, relationships, entityFilters, clusterHighlightType } = get();
    if (clusterHighlightType === type) {
      // Toggle off
      set({ clusterHighlightType: null, highlightedNodeIds: [], highlightedEdgeIds: [] });
      return;
    }
    const clusterIds = entities.filter(e => e.type === type && entityFilters[e.type]).map(e => e.id);
    const clusterSet = new Set(clusterIds);
    const edgeIds = relationships.filter(r => {
      const sid = typeof r.source === 'object' ? r.source.id : r.source;
      const tid = typeof r.target === 'object' ? r.target.id : r.target;
      return clusterSet.has(sid) && clusterSet.has(tid);
    }).map(r => r.id);
    set({
      clusterHighlightType: type,
      highlightedNodeIds: clusterIds,
      highlightedEdgeIds: edgeIds,
    });
  },

  resetGraphLayout: () => set((s) => ({ graphLayoutVersion: s.graphLayoutVersion + 1 })),

  getFilteredEntities: () => {
    const { entities, entityFilters } = get();
    return entities.filter(e => entityFilters[e.type]);
  },

  getFilteredRelationships: () => {
    const { relationships, entities, entityFilters } = get();
    const filteredIds = new Set(entities.filter(e => entityFilters[e.type]).map(e => e.id));
    return relationships.filter(r => filteredIds.has(r.source) && filteredIds.has(r.target));
  },

  // ===== LOAD SAMPLE CASE =====
  loadSampleCase: () => {
    set({
      activeCase: SAMPLE_CASE,
      entities: SAMPLE_CASE.entities,
      relationships: SAMPLE_CASE.relationships,
      events: SAMPLE_CASE.events,
      rawIntelligence: SAMPLE_CASE.rawIntelligence,
      caseName: SAMPLE_CASE.name,
      caseType: SAMPLE_CASE.type,
      analysisComplete: true,
      lastAnalysisTime: new Date().toISOString(),
      selectedEntity: null,
      investigationSteps: [
        { id: 'ingestion', name: 'Data Ingestion', status: 'complete', progress: 100 },
        { id: 'mapping', name: 'Entity Mapping', status: 'complete', progress: 100 },
        { id: 'relationships', name: 'Relationship Analysis', status: 'complete', progress: 100 },
        { id: 'patterns', name: 'Pattern Detection', status: 'complete', progress: 100 },
        { id: 'behavioral', name: 'Behavioral Analysis', status: 'complete', progress: 100 },
        { id: 'reasoning', name: 'AI Reasoning', status: 'complete', progress: 100 },
        { id: 'recommendation', name: 'Operational Recommendation', status: 'complete', progress: 100 },
      ],
    });

    // Generate AI insights after loading
    setTimeout(() => {
      get().generateInsights();
    }, 500);
  },

  // ===== RUN ANALYSIS =====
  runAnalysis: async () => {
    const { rawIntelligence, caseName, caseType } = get();
    if (!rawIntelligence.trim()) return;

    set({ analysisRunning: true });

    const steps = [
      'ingestion', 'mapping', 'relationships', 'patterns',
      'behavioral', 'reasoning', 'recommendation'
    ];

    for (let i = 0; i < steps.length; i++) {
      set((s) => ({
        investigationSteps: s.investigationSteps.map((step, idx) =>
          idx === i ? { ...step, status: 'active', progress: 0 } :
          idx < i ? { ...step, status: 'complete', progress: 100 } : step
        )
      }));

      // Simulate progress
      for (let p = 0; p <= 100; p += 20) {
        await new Promise(r => setTimeout(r, 80));
        set((s) => ({
          investigationSteps: s.investigationSteps.map((step, idx) =>
            idx === i ? { ...step, progress: p } : step
          )
        }));
      }

      set((s) => ({
        investigationSteps: s.investigationSteps.map((step, idx) =>
          idx === i ? { ...step, status: 'complete', progress: 100 } : step
        )
      }));
    }

    // Extract entities from raw text
    const { extractEntities } = await import('../engine/entityExtractor');
    const { buildRelationships } = await import('../engine/relationshipMapper');
    const { calculateRiskScores } = await import('../engine/riskEngine');

    const extracted = extractEntities(rawIntelligence);
    const rels = buildRelationships(extracted, rawIntelligence);
    const scored = calculateRiskScores(extracted, rels);

    const caseData = {
      id: `CASE-${Date.now().toString(36).toUpperCase()}`,
      name: caseName || 'Unnamed Investigation',
      type: caseType,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    set({
      activeCase: caseData,
      entities: scored,
      relationships: rels,
      events: generateEventsFromEntities(scored, rels),
      analysisRunning: false,
      analysisComplete: true,
      lastAnalysisTime: new Date().toISOString(),
    });

    // Save to cases list
    set((s) => ({
      cases: [...s.cases.filter(c => c.id !== caseData.id), {
        ...caseData,
        entityCount: scored.length,
        relationshipCount: rels.length,
      }]
    }));

    // Generate insights
    setTimeout(() => get().generateInsights(), 300);
  },

  // ===== GENERATE AI INSIGHTS =====
  generateInsights: () => {
    const { entities, relationships, events } = get();
    if (!entities.length) return;

    const insights = generateAIInsights(entities, relationships, events);

    // Coordinate risk scores with behavioral telemetry and active anomalies
    import('../engine/riskEngine').then(({ calculateRiskScores }) => {
      const updatedEntities = calculateRiskScores(
        entities, 
        relationships, 
        insights.rawBehaviorProfiles || {}, 
        insights.rawAnomalies || []
      );
      
      set({
        entities: updatedEntities,
        aiInsights: insights,
        patterns: insights.patterns || [],
        predictions: insights.predictions || [],
        
        // V2 State variables
        anomalies: insights.rawAnomalies || [],
        behaviorProfiles: insights.rawBehaviorProfiles || {},
        relationshipConfidence: insights.rawRelationshipConfidence || {},
        clusters: insights.clusters || [],
        timelineIntelligence: insights.rawTimelineIntelligence || null,
        operationalPatterns: insights.rawOperationalPatterns || [],
      });
    });
  },

  // ===== CLEAR CASE =====
  clearCase: () => set({
    activeCase: null,
    entities: [],
    relationships: [],
    events: [],
    rawIntelligence: '',
    caseName: '',
    selectedEntity: null,
    analysisComplete: false,
    analysisRunning: false,
    aiInsights: null,
    patterns: [],
    predictions: [],
    lastAnalysisTime: null,
    investigationSteps: [
      { id: 'ingestion', name: 'Data Ingestion', status: 'pending', progress: 0 },
      { id: 'mapping', name: 'Entity Mapping', status: 'pending', progress: 0 },
      { id: 'relationships', name: 'Relationship Analysis', status: 'pending', progress: 0 },
      { id: 'patterns', name: 'Pattern Detection', status: 'pending', progress: 0 },
      { id: 'behavioral', name: 'Behavioral Analysis', status: 'pending', progress: 0 },
      { id: 'reasoning', name: 'AI Reasoning', status: 'pending', progress: 0 },
      { id: 'recommendation', name: 'Operational Recommendation', status: 'pending', progress: 0 },
    ],
  }),

  // ===== LOAD CASE =====
  loadCase: (caseId) => {
    const saved = localStorage.getItem(`noctis_case_${caseId}`);
    if (saved) {
      const data = JSON.parse(saved);
      set({ ...data });
    }
  },

  // ===== SAVE CASE =====
  saveCurrentCase: () => {
    const state = get();
    if (state.activeCase) {
      localStorage.setItem(`noctis_case_${state.activeCase.id}`, JSON.stringify({
        activeCase: state.activeCase,
        entities: state.entities,
        relationships: state.relationships,
        events: state.events,
        rawIntelligence: state.rawIntelligence,
        aiInsights: state.aiInsights,
        patterns: state.patterns,
        predictions: state.predictions,
      }));
    }
  },

  // ===== IMPORT CASE DATA =====
  importCaseData: (caseData) => {
    set({
      activeCase: caseData.activeCase || {
        id: `CASE-${Date.now().toString(36).toUpperCase()}`,
        name: caseData.name || caseData.caseName || 'Imported Case',
        type: caseData.type || caseData.caseType || 'Cyber Investigation',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      },
      entities: caseData.entities || [],
      relationships: caseData.relationships || [],
      events: caseData.events || [],
      rawIntelligence: caseData.rawIntelligence || '',
      caseName: caseData.name || caseData.caseName || 'Imported Case',
      caseType: caseData.type || caseData.caseType || 'Cyber Investigation',
      analysisComplete: true,
      analysisRunning: false,
      lastAnalysisTime: new Date().toISOString(),
      selectedEntity: null,
      investigationSteps: [
        { id: 'ingestion', name: 'Data Ingestion', status: 'complete', progress: 100 },
        { id: 'mapping', name: 'Entity Mapping', status: 'complete', progress: 100 },
        { id: 'relationships', name: 'Relationship Analysis', status: 'complete', progress: 100 },
        { id: 'patterns', name: 'Pattern Detection', status: 'complete', progress: 100 },
        { id: 'behavioral', name: 'Behavioral Analysis', status: 'complete', progress: 100 },
        { id: 'reasoning', name: 'AI Reasoning', status: 'complete', progress: 100 },
        { id: 'recommendation', name: 'Operational Recommendation', status: 'complete', progress: 100 },
      ],
    });
    // Generate AI insights after loading
    setTimeout(() => {
      get().generateInsights();
    }, 300);
  },
}));

function generateEventsFromEntities(entities, relationships) {
  const events = [];
  const suspiciousRels = relationships.filter(r => r.suspicious);
  
  suspiciousRels.forEach((rel, i) => {
    const source = entities.find(e => e.id === rel.source);
    const target = entities.find(e => e.id === rel.target);
    if (source && target) {
      events.push({
        id: `ev_auto_${i}`,
        timestamp: new Date(Date.now() - (suspiciousRels.length - i) * 86400000).toISOString(),
        type: 'alert',
        title: `Suspicious: ${source.name} → ${target.name}`,
        description: `${rel.label} detected between ${source.name} and ${target.name}`,
        entities: [rel.source, rel.target],
        severity: rel.weight > 7 ? 'critical' : rel.weight > 5 ? 'high' : 'medium',
        category: 'alert',
      });
    }
  });
  
  return events;
}

export default useStore;
