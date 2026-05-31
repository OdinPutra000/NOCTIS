// ===== NOCTIS V2 AI INVESTIGATION REASONING ENGINE =====
// Coordinates and processes V2 behavioral intelligence engines to generate analytical reports

import { detectAnomalies } from './anomalyEngine';
import { analyzeBehavior } from './behaviorEngine';
import { calculateRelationshipConfidence } from './confidenceEngine';
import { detectClusters } from './clusterEngine';
import { analyzeTimeline } from './timelineEngine';
import { detectPatterns } from './patternEngine';

/**
 * Executes a full behavioral intelligence analysis pass across all engines.
 * @param {Array} entities 
 * @param {Array} relationships 
 * @param {Array} events 
 * @returns {Object} Multi-dimensional behavioral intelligence assessment
 */
export function generateAIInsights(entities, relationships, events) {
  if (!entities || entities.length === 0) {
    return {
      summary: 'No active entities loaded in system memory.',
      suspiciousExplanations: [],
      behavioralObservations: [],
      relationshipReasoning: [],
      predictions: [],
      patterns: [],
      centralEntities: [],
      clusters: [],
      riskAssessment: { avgRisk: 0, maxRisk: 0, suspRatio: 0, overallLevel: 'LOW' }
    };
  }

  // 1. RUN CORE ENGINES
  const anomalies = detectAnomalies(entities, relationships, events);
  const behaviorProfiles = analyzeBehavior(entities, relationships, events, anomalies);
  const confidenceProfiles = calculateRelationshipConfidence(relationships, entities, events);
  const clusterData = detectClusters(entities, relationships);
  const timelineData = analyzeTimeline(events, entities);
  const patternData = detectPatterns(entities, relationships, events);

  // 2. GENERATE PREMIUM INTELLIGENCE BRIEF
  const criticalAnomCount = anomalies.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH').length;
  const escalatingCount = Object.values(behaviorProfiles).filter(p => p.trend === 'ESCALATING').length;
  
  let summary = `Operational analysis of ${entities.length} nodes and ${relationships.length} active links resolved ${anomalies.length} distinct anomalies, with ${criticalAnomCount} flagged at CRITICAL/HIGH severity. `;
  summary += `Behavioral profiles list ${escalatingCount} endpoints exhibiting active risk escalation. `;
  
  if (clusterData.clusters.length > 0) {
    const topCell = clusterData.clusters[0];
    summary += `Topology checks resolved ${clusterData.clusters.length} active communities. The highest threat cluster is ${topCell.name} (average threat risk: ${topCell.avgRisk}%, central hub: ${topCell.hubName}). `;
  }

  summary += `Network threat vectors display ${patternData.length} distinct operational signatures, indicating a highly coordinated operational footprint.`;

  // 3. GENERATE SUSPICIOUS EXPLANATIONS (Why entities are dangerous)
  const suspiciousExplanations = Object.values(behaviorProfiles)
    .sort((a, b) => b.behaviorScore - a.behaviorScore)
    .slice(0, 5)
    .map(p => {
      const ent = entities.find(e => e.id === p.entityId);
      const entAnom = anomalies.filter(a => a.affectedEntities && a.affectedEntities.includes(p.entityId));
      
      let explanation = `Subject "${p.name}" (${p.type.toUpperCase()}) exhibits a Critical Behavioral Score of ${p.behaviorScore}/100 with an ${p.trend} trend. `;
      explanation += `Operational footprint records ${entAnom.length} distinct anomalies, primary: ${entAnom[0]?.title || 'irregular network connection'}. `;
      explanation += p.assessment;

      return {
        entity: ent,
        behaviorProfile: p,
        explanation
      };
    });

  // 4. BEHAVIORAL OBSERVATIONS
  const behavioralObservations = [];
  Object.values(behaviorProfiles)
    .filter(p => p.behaviorScore >= 60)
    .forEach(p => {
      behavioralObservations.push(
        `[${p.trend}] ${p.name} exhibits a significant behavioral deviation score of ${p.behaviorScore}/100. Flags active: [${p.behaviorFlags.join(', ')}].`
      );
    });

  if (anomalies.length > 0) {
    anomalies.slice(0, 3).forEach(anom => {
      behavioralObservations.push(
        `[ANOMALY] ${anom.title} detected on ${anom.affectedEntities.length} endpoints. Explanation: ${anom.explanation}`
      );
    });
  }

  if (behavioralObservations.length === 0) {
    behavioralObservations.push('No significant operational anomalies or behavioral deviations detected in current cycle.');
  }

  // 5. RELATIONSHIP REASONING (Why links are suspicious)
  const relationshipReasoning = relationships
    .filter(r => r.suspicious || r.weight >= 7)
    .map(r => {
      const source = entities.find(e => e.id === r.source);
      const target = entities.find(e => e.id === r.target);
      const confProfile = confidenceProfiles[r.id] || { confidence: r.weight * 10, trustLevel: 'UNVERIFIED', evidence: [] };
      
      return {
        source: source?.name || 'Unknown',
        target: target?.name || 'Unknown',
        type: r.type,
        label: r.label,
        weight: r.weight,
        confidence: confProfile.confidence,
        trustLevel: confProfile.trustLevel,
        reasoning: `Link resolved between ${source?.name} and ${target?.name} is verified at ${confProfile.confidence}% confidence (Trust Level: ${confProfile.trustLevel}). Audited evidence: ${confProfile.evidence.join('; ')}.`
      };
    })
    .sort((a, b) => b.weight - a.weight);

  // 6. PREDICTIVE PREPARATION & INDICATORS
  const predictions = [];
  if (patternData.length > 0) {
    patternData.slice(0, 3).forEach(pat => {
      let title = '';
      let desc = '';
      let conf = pat.confidence;
      let severity = pat.severity;

      if (pat.type === 'hub_spoke') {
        title = 'Coordinated Asset Propagation';
        desc = `High probability of operational asset delivery and command distribution from hub "${pat.name}" to peripheral nodes within 24-48 hours.`;
      } else if (pat.type === 'chain_flow') {
        title = 'Sequential Transit Transfer';
        desc = `Active linear flow sequence suggests imminent operational payload or financial transfer to endpoint "${entities.find(e => e.id === pat.involvedEntities[pat.involvedEntities.length-1])?.name}".`;
      } else if (pat.type === 'infrastructure_reuse') {
        title = 'Infrastructure Multi-Vector Attack';
        desc = `Shared asset access indicators confirm threat actors will leverage joint IP/Domain endpoints to launch parallel campaigns.`;
      } else {
        title = 'Operational Escalation Wave';
        desc = `Synchronized timeline clustering patterns indicate threat actors are preparing for a targeted deployment surge.`;
      }

      predictions.push({
        id: `pred_${pat.id}`,
        title,
        description: desc,
        confidence: conf,
        severity
      });
    });
  }

  // Fallbacks if no pattern-based predictions
  if (predictions.length === 0) {
    predictions.push({
      id: 'pred_fallback_comms',
      title: 'Communication Protocol Shifts',
      description: 'Threat actors are highly likely to transition active channels to secondary proxy devices to evade timeline correlation.',
      confidence: 72,
      severity: 'MEDIUM'
    });
  }

  // 7. STRUCTURAL SUMMARY METRICS
  const totalRisk = entities.reduce((s, e) => s + (e.risk || 0), 0);
  const avgRisk = Math.round(totalRisk / entities.length);
  const maxRisk = Math.max(...entities.map(e => e.risk || 0), 0);
  const suspRatio = relationships.length > 0 
    ? Math.round((relationships.filter(r => r.suspicious).length / relationships.length) * 100) 
    : 0;
  
  let overallLevel = 'LOW';
  if (avgRisk >= 60 || maxRisk >= 90) overallLevel = 'CRITICAL';
  else if (avgRisk >= 45 || maxRisk >= 70) overallLevel = 'HIGH';
  else if (avgRisk >= 30) overallLevel = 'MEDIUM';

  return {
    summary,
    suspiciousExplanations,
    behavioralObservations,
    relationshipReasoning: relationshipReasoning.slice(0, 8),
    predictions: predictions.sort((a, b) => b.confidence - a.confidence),
    patterns: anomalies.map(a => ({
      id: a.id,
      type: a.title,
      description: a.explanation,
      severity: a.severity.toLowerCase(),
      entities: a.affectedEntities
    })),
    centralEntities: clusterData.hubs.map(id => entities.find(e => e.id === id)).filter(Boolean),
    clusters: clusterData.clusters,
    riskAssessment: { avgRisk, maxRisk, suspRatio, overallLevel },
    
    // Core Engine raw outputs for Zustand store integration
    rawAnomalies: anomalies,
    rawBehaviorProfiles: behaviorProfiles,
    rawRelationshipConfidence: confidenceProfiles,
    rawTimelineIntelligence: timelineData,
    rawOperationalPatterns: patternData
  };
}

/**
 * Generates an intelligence brief for a single entity.
 * @param {Object} entity 
 * @param {Array} entities 
 * @param {Array} relationships 
 * @param {Array} events 
 * @param {Object} insights Full pre-computed V2 insights
 * @returns {Object} Detailed entity behavioral brief
 */
export function generateEntityInsights(entity, caseData, precomputedInsights = null) {
  if (!entity) return null;

  const insights = precomputedInsights || generateAIInsights(caseData.entities, caseData.relationships, caseData.events);
  const profile = insights.rawBehaviorProfiles?.[entity.id];
  const entAnom = insights.rawAnomalies?.filter(a => a.affectedEntities && a.affectedEntities.includes(entity.id)) || [];
  
  const explanations = [];
  
  if (profile) {
    explanations.push({
      id: `ent_brief_score_${entity.id}`,
      type: 'behavioral_analysis',
      title: 'Behavioral Diagnostics Profile',
      content: profile.assessment,
      severity: profile.behaviorScore >= 75 ? 'critical' : profile.behaviorScore >= 50 ? 'high' : 'medium',
      confidence: 90
    });
  }

  entAnom.forEach(anom => {
    explanations.push({
      id: `ent_brief_anom_${anom.id}`,
      type: 'timeline_anomaly',
      title: `Anomaly: ${anom.title}`,
      content: anom.explanation,
      severity: anom.severity.toLowerCase(),
      confidence: anom.confidence
    });
  });

  // Check pattern involvements
  const patterns = insights.rawOperationalPatterns?.filter(p => p.involvedEntities && p.involvedEntities.includes(entity.id)) || [];
  patterns.forEach(pat => {
    explanations.push({
      id: `ent_brief_pat_${pat.id}`,
      type: 'pattern_detected',
      title: `Pattern involvement: ${pat.name}`,
      content: pat.description,
      severity: pat.severity.toLowerCase(),
      confidence: pat.confidence
    });
  });

  return explanations;
}
