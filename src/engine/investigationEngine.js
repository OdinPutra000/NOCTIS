// ===== NOCTIS V2 INVESTIGATION MODE ENGINE =====
// Synthesizes outputs from existing engines into investigation-grade briefings
// Does NOT duplicate logic — consumes pre-computed engine outputs

/**
 * Generates a comprehensive Case Scorecard from existing analysis data.
 * @param {Array} entities
 * @param {Array} relationships
 * @param {Array} anomalies
 * @param {Object} behaviorProfiles
 * @param {Array} clusters
 * @returns {Object} Case scorecard metrics
 */
export function generateCaseScorecard(entities, relationships, anomalies, behaviorProfiles, clusters) {
  const entityCount = entities.length;
  const relationshipCount = relationships.length;
  const anomalyCount = anomalies.length;

  // Behavior Risk Score — average of all behavior scores
  const profiles = Object.values(behaviorProfiles || {});
  const behaviorRiskScore = profiles.length > 0
    ? Math.round(profiles.reduce((sum, p) => sum + (p.behaviorScore || 0), 0) / profiles.length)
    : 0;

  // Threat Level
  const criticalAnomalies = anomalies.filter(a => a.severity === 'CRITICAL').length;
  const highAnomalies = anomalies.filter(a => a.severity === 'HIGH').length;
  const escalatingCount = profiles.filter(p => p.trend === 'ESCALATING').length;

  let threatLevel = 'LOW';
  if (criticalAnomalies >= 2 || behaviorRiskScore >= 70) threatLevel = 'CRITICAL';
  else if (criticalAnomalies >= 1 || highAnomalies >= 3 || behaviorRiskScore >= 55) threatLevel = 'HIGH';
  else if (highAnomalies >= 1 || behaviorRiskScore >= 35) threatLevel = 'MEDIUM';

  // Investigation Confidence — based on data completeness
  let confidenceFactors = 0;
  let confidenceMax = 0;

  confidenceMax += 20;
  confidenceFactors += entityCount >= 5 ? 20 : entityCount >= 2 ? 12 : entityCount > 0 ? 6 : 0;

  confidenceMax += 20;
  confidenceFactors += relationshipCount >= 10 ? 20 : relationshipCount >= 5 ? 14 : relationshipCount > 0 ? 7 : 0;

  confidenceMax += 20;
  confidenceFactors += anomalyCount >= 3 ? 20 : anomalyCount >= 1 ? 12 : 0;

  confidenceMax += 20;
  confidenceFactors += profiles.length >= 3 ? 20 : profiles.length >= 1 ? 10 : 0;

  confidenceMax += 20;
  confidenceFactors += (clusters || []).length >= 1 ? 20 : 0;

  const investigationConfidence = confidenceMax > 0 ? Math.round((confidenceFactors / confidenceMax) * 100) : 0;

  // Case Complexity
  const complexityScore = Math.min(100, Math.round(
    (entityCount * 2) +
    (relationshipCount * 1.5) +
    (anomalyCount * 5) +
    ((clusters || []).length * 8) +
    (escalatingCount * 10)
  ));

  let caseComplexity = 'MINIMAL';
  if (complexityScore >= 80) caseComplexity = 'EXTREME';
  else if (complexityScore >= 55) caseComplexity = 'HIGH';
  else if (complexityScore >= 30) caseComplexity = 'MODERATE';

  return {
    entityCount,
    relationshipCount,
    anomalyCount,
    behaviorRiskScore,
    threatLevel,
    investigationConfidence,
    caseComplexity,
    complexityScore,
    criticalAnomalies,
    highAnomalies,
    escalatingCount,
  };
}

/**
 * Generates prioritized recommended actions from existing analysis.
 * @param {Array} entities
 * @param {Array} relationships
 * @param {Array} anomalies
 * @param {Array} patterns - operationalPatterns
 * @param {Array} clusters
 * @param {Object} behaviorProfiles
 * @returns {Array} Recommended actions
 */
export function generateRecommendedActions(entities, relationships, anomalies, patterns, clusters, behaviorProfiles) {
  const actions = [];
  const profiles = Object.values(behaviorProfiles || {});

  // 1. Investigate highest-risk entity
  const highRiskEntities = [...entities].sort((a, b) => (b.risk || 0) - (a.risk || 0));
  if (highRiskEntities.length > 0) {
    const top = highRiskEntities[0];
    actions.push({
      id: 'rec_investigate_entity',
      title: `Investigate Entity: ${top.name}`,
      description: `"${top.name}" has the highest risk score (${top.risk}/100) in the network. Conduct deep behavioral analysis and trace all connection pathways to uncover operational scope.`,
      confidence: Math.min(98, 70 + Math.round(top.risk / 5)),
      priority: 'CRITICAL',
      reasoning: `Risk score ${top.risk}/100 exceeds threshold. Entity type: ${top.type}. Status: ${top.status || 'UNKNOWN'}.`,
      entityId: top.id,
      actionType: 'investigate',
    });
  }

  // 2. Expand suspicious clusters
  if ((clusters || []).length > 0) {
    const topCluster = clusters[0];
    actions.push({
      id: 'rec_expand_cluster',
      title: `Expand Cluster: ${topCluster.name}`,
      description: `Cluster "${topCluster.name}" contains ${topCluster.entities?.length || 0} members with a ${topCluster.threatLevel} threat classification. Expand investigation to identify hidden periphery nodes and external contacts.`,
      confidence: 88,
      priority: 'HIGH',
      reasoning: `Cluster density: ${Math.round((topCluster.density || 0) * 100)}%. Hub coordinator: ${topCluster.hubName || topCluster.hub}. Suspicious link ratio: ${Math.round((topCluster.suspiciousLinkRatio || 0) * 100)}%.`,
      actionType: 'expand_cluster',
    });
  }

  // 3. Review critical anomalies
  const criticalAnomalies = anomalies.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH');
  if (criticalAnomalies.length > 0) {
    const topAnomaly = criticalAnomalies[0];
    actions.push({
      id: 'rec_review_anomaly',
      title: `Review Anomaly: ${topAnomaly.title}`,
      description: `${topAnomaly.explanation}. This ${topAnomaly.severity}-severity anomaly affects ${topAnomaly.affectedEntities?.length || 0} entities and requires immediate operational review.`,
      confidence: topAnomaly.confidence || 85,
      priority: topAnomaly.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      reasoning: `Severity: ${topAnomaly.severity}. Confidence: ${topAnomaly.confidence || 'N/A'}%. Affected entities: ${topAnomaly.affectedEntities?.length || 0}.`,
      actionType: 'review_anomaly',
    });
  }

  // 4. Analyze escalating behavior profiles
  const escalating = profiles.filter(p => p.trend === 'ESCALATING').sort((a, b) => b.behaviorScore - a.behaviorScore);
  if (escalating.length > 0) {
    const top = escalating[0];
    actions.push({
      id: 'rec_analyze_behavior',
      title: `Monitor Escalating Behavior: ${top.name}`,
      description: `"${top.name}" exhibits an ESCALATING behavioral trend with a score of ${top.behaviorScore}/100. Active flags: [${(top.behaviorFlags || []).join(', ')}]. Continuous monitoring and timeline correlation recommended.`,
      confidence: Math.min(95, 65 + Math.round(top.behaviorScore / 5)),
      priority: top.behaviorScore >= 75 ? 'CRITICAL' : 'HIGH',
      reasoning: `Behavior score: ${top.behaviorScore}/100. Trend: ${top.trend}. Flags: ${(top.behaviorFlags || []).length} active.`,
      entityId: top.entityId,
      actionType: 'monitor_behavior',
    });
  }

  // 5. Investigate detected patterns
  if ((patterns || []).length > 0) {
    const topPattern = patterns[0];
    const involvedNames = (topPattern.involvedEntities || [])
      .slice(0, 3)
      .map(id => entities.find(e => e.id === id)?.name || id)
      .join(', ');
    actions.push({
      id: 'rec_investigate_pattern',
      title: `Investigate Pattern: ${topPattern.name}`,
      description: `Structural pattern "${topPattern.name}" detected involving [${involvedNames}]. ${topPattern.description?.substring(0, 120) || 'Detailed structural analysis required.'}`,
      confidence: topPattern.confidence || 80,
      priority: topPattern.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      reasoning: `Pattern type: ${topPattern.type}. Confidence: ${topPattern.confidence}%. Involved entities: ${(topPattern.involvedEntities || []).length}.`,
      actionType: 'investigate_pattern',
    });
  }

  // 6. Review suspicious relationships
  const suspiciousRels = relationships.filter(r => r.suspicious).sort((a, b) => (b.weight || 0) - (a.weight || 0));
  if (suspiciousRels.length > 0) {
    const topRel = suspiciousRels[0];
    const source = entities.find(e => e.id === topRel.source);
    const target = entities.find(e => e.id === topRel.target);
    actions.push({
      id: 'rec_review_relationship',
      title: `Analyze Relationship: ${source?.name || 'Unknown'} ↔ ${target?.name || 'Unknown'}`,
      description: `The link between "${source?.name}" and "${target?.name}" (${topRel.label}) carries a weight of ${topRel.weight}/10 and is flagged as suspicious. Investigate communication channels and shared infrastructure.`,
      confidence: Math.min(92, 60 + (topRel.weight || 0) * 4),
      priority: (topRel.weight || 0) >= 8 ? 'CRITICAL' : 'HIGH',
      reasoning: `Relationship type: ${topRel.type}. Weight: ${topRel.weight}/10. Label: ${topRel.label}.`,
      actionType: 'analyze_relationship',
    });
  }

  // 7. Map operational geography (if locations exist)
  const entitiesWithLocation = entities.filter(e => e.location && e.location.lat);
  if (entitiesWithLocation.length >= 2) {
    actions.push({
      id: 'rec_map_geography',
      title: 'Map Operational Geography',
      description: `${entitiesWithLocation.length} entities have confirmed geospatial coordinates. Cross-reference movement patterns with communication timelines to identify operational staging areas and transit corridors.`,
      confidence: 75,
      priority: 'MEDIUM',
      reasoning: `${entitiesWithLocation.length} geo-located entities available for spatial analysis.`,
      actionType: 'map_geography',
    });
  }

  // 8. Export and archive
  actions.push({
    id: 'rec_export_report',
    title: 'Generate Investigation Report',
    description: 'Compile all findings, anomalies, patterns, and recommendations into a comprehensive intelligence report for case documentation and operational handoff.',
    confidence: 100,
    priority: 'LOW',
    reasoning: 'Standard operating procedure for investigation closure and evidence preservation.',
    actionType: 'export_report',
  });

  return actions.sort((a, b) => {
    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
  });
}

/**
 * Generates an executive investigation summary.
 * @returns {Object} Executive summary with key findings
 */
export function generateExecutiveSummary(entities, relationships, anomalies, patterns, clusters, behaviorProfiles) {
  const profiles = Object.values(behaviorProfiles || {});

  // Most Important Entity
  const sortedByRisk = [...entities].sort((a, b) => (b.risk || 0) - (a.risk || 0));
  const mostImportant = sortedByRisk[0] || null;

  // Most Suspicious Relationship
  const suspRels = relationships.filter(r => r.suspicious).sort((a, b) => (b.weight || 0) - (a.weight || 0));
  const mostSuspiciousRel = suspRels[0] || null;
  let mostSuspiciousRelText = 'No suspicious relationships detected.';
  if (mostSuspiciousRel) {
    const src = entities.find(e => e.id === mostSuspiciousRel.source);
    const tgt = entities.find(e => e.id === mostSuspiciousRel.target);
    mostSuspiciousRelText = `${src?.name || 'Unknown'} ↔ ${tgt?.name || 'Unknown'} — ${mostSuspiciousRel.label} (weight: ${mostSuspiciousRel.weight}/10)`;
  }

  // Critical Cluster
  const criticalCluster = (clusters || []).length > 0 ? clusters[0] : null;

  // Operational Concerns
  const concerns = [];
  const escalatingProfiles = profiles.filter(p => p.trend === 'ESCALATING');
  if (escalatingProfiles.length > 0) {
    concerns.push(`${escalatingProfiles.length} entity/entities exhibiting active behavioral escalation patterns.`);
  }
  const criticalAnoms = anomalies.filter(a => a.severity === 'CRITICAL');
  if (criticalAnoms.length > 0) {
    concerns.push(`${criticalAnoms.length} CRITICAL-severity anomaly/anomalies requiring immediate attention.`);
  }
  if ((patterns || []).some(p => p.type === 'hub_spoke' || p.type === 'centralized_control')) {
    concerns.push('Command-and-control topology detected — indicates organized threat coordination.');
  }
  if ((patterns || []).some(p => p.type === 'infrastructure_reuse')) {
    concerns.push('Shared infrastructure assets detected — multiple threat actors converging on common resources.');
  }
  if (concerns.length === 0) {
    concerns.push('No immediate operational concerns identified. Recommend continued monitoring.');
  }

  // Key Findings
  const keyFindings = [];
  keyFindings.push(`${entities.length} entities and ${relationships.length} relationships mapped across the intelligence network.`);
  if (anomalies.length > 0) {
    keyFindings.push(`${anomalies.length} operational anomalies detected, ${anomalies.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH').length} classified at HIGH/CRITICAL severity.`);
  }
  if (profiles.length > 0) {
    const avgScore = Math.round(profiles.reduce((s, p) => s + p.behaviorScore, 0) / profiles.length);
    keyFindings.push(`Average behavioral deviation score: ${avgScore}/100 across ${profiles.length} profiled entities.`);
  }
  if ((patterns || []).length > 0) {
    keyFindings.push(`${patterns.length} structural threat patterns identified, including ${[...new Set(patterns.map(p => p.type))].join(', ')}.`);
  }
  if ((clusters || []).length > 0) {
    keyFindings.push(`${clusters.length} coordinated operational clusters resolved. Primary cluster: "${clusters[0].name}" (${clusters[0].entities?.length || 0} members).`);
  }

  // Executive Summary Text
  let summaryText = `Investigation analysis of ${entities.length} intelligence nodes and ${relationships.length} operational links has resolved `;
  summaryText += `${anomalies.length} behavioral anomalies and ${(patterns || []).length} structural threat patterns. `;
  if (mostImportant) {
    summaryText += `The primary entity of interest is "${mostImportant.name}" (${mostImportant.type}) with a risk assessment of ${mostImportant.risk}/100. `;
  }
  if (escalatingProfiles.length > 0) {
    summaryText += `${escalatingProfiles.length} entities are exhibiting active behavioral escalation, indicating potential operational acceleration. `;
  }
  summaryText += `Case requires ${concerns.length > 1 ? 'immediate multi-vector' : 'continued'} investigative attention.`;

  return {
    summaryText,
    keyFindings,
    mostImportantEntity: mostImportant,
    mostSuspiciousRelationship: mostSuspiciousRelText,
    criticalCluster: criticalCluster ? {
      name: criticalCluster.name,
      memberCount: criticalCluster.entities?.length || 0,
      hub: criticalCluster.hubName || criticalCluster.hub,
      threatLevel: criticalCluster.threatLevel,
    } : null,
    operationalConcerns: concerns,
    entityCount: entities.length,
    relationshipCount: relationships.length,
    anomalyCount: anomalies.length,
    patternCount: (patterns || []).length,
  };
}

/**
 * Computes investigation progress percentage based on completed steps.
 * @param {Array} investigationSteps
 * @returns {number} 0-100
 */
export function computeInvestigationProgress(investigationSteps) {
  if (!investigationSteps || investigationSteps.length === 0) return 0;
  const completed = investigationSteps.filter(s => s.status === 'complete').length;
  return Math.round((completed / investigationSteps.length) * 100);
}

/**
 * Generates an AI explanation for each investigation pipeline step.
 * @param {string} stepIndex - 0-7
 * @param {Object} store - snapshot of relevant store data
 * @returns {Object} { title, explanation, metrics }
 */
export function generateStepInsight(stepIndex, store) {
  const { entities = [], relationships = [], anomalies = [], behaviorProfiles = {}, operationalPatterns = [], clusters = [], aiInsights, rawIntelligence = '' } = store;
  const profiles = Object.values(behaviorProfiles);

  switch (stepIndex) {
    case 0: { // Data Ingestion
      const charCount = rawIntelligence.length;
      const lineCount = rawIntelligence ? rawIntelligence.split('\n').length : 0;
      return {
        title: 'Data Ingestion Complete',
        explanation: charCount > 0
          ? `Intelligence payload received: ${charCount.toLocaleString()} characters across ${lineCount} lines of raw intelligence data. The ingestion pipeline has parsed and staged all records for entity extraction. Data quality assessment indicates ${charCount > 500 ? 'substantial' : 'limited'} source material for analysis.`
          : 'No raw intelligence data has been ingested. Load a case file or paste intelligence data to begin the investigation pipeline.',
        metrics: [
          { label: 'Characters', value: charCount.toLocaleString() },
          { label: 'Lines', value: lineCount },
          { label: 'Status', value: charCount > 0 ? 'INGESTED' : 'AWAITING DATA' },
        ],
      };
    }
    case 1: { // Entity Extraction
      const typeCounts = {};
      entities.forEach(e => { typeCounts[e.type] = (typeCounts[e.type] || 0) + 1; });
      const typeEntries = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
      return {
        title: 'Entity Extraction Complete',
        explanation: entities.length > 0
          ? `Extraction pipeline resolved ${entities.length} distinct intelligence entities from source data. Primary entity distribution: ${typeEntries.map(([t, c]) => `${c} ${t}(s)`).join(', ')}. All entities have been tagged, classified, and staged for relationship mapping.`
          : 'No entities have been extracted. Ensure data has been ingested before running entity extraction.',
        metrics: typeEntries.map(([type, count]) => ({ label: type.charAt(0).toUpperCase() + type.slice(1) + 's', value: count })),
      };
    }
    case 2: { // Relationship Mapping
      const suspicious = relationships.filter(r => r.suspicious).length;
      const avgWeight = relationships.length > 0
        ? (relationships.reduce((s, r) => s + (r.weight || 0), 0) / relationships.length).toFixed(1)
        : 0;
      return {
        title: 'Relationship Mapping Complete',
        explanation: relationships.length > 0
          ? `Link analysis resolved ${relationships.length} inter-entity relationships. ${suspicious} links flagged as suspicious (${relationships.length > 0 ? Math.round(suspicious / relationships.length * 100) : 0}% of total). Average link weight: ${avgWeight}/10. Direct and indirect connection pathways have been mapped for graph intelligence rendering.`
          : 'No relationships mapped. Entity extraction must complete before relationship analysis.',
        metrics: [
          { label: 'Total Links', value: relationships.length },
          { label: 'Suspicious', value: suspicious },
          { label: 'Avg Weight', value: avgWeight },
        ],
      };
    }
    case 3: { // Behavioral Analysis
      const avgBehavior = profiles.length > 0
        ? Math.round(profiles.reduce((s, p) => s + p.behaviorScore, 0) / profiles.length)
        : 0;
      const escalating = profiles.filter(p => p.trend === 'ESCALATING').length;
      const flagged = profiles.filter(p => (p.behaviorFlags || []).length > 0).length;
      return {
        title: 'Behavioral Analysis Complete',
        explanation: profiles.length > 0
          ? `Behavioral profiling completed for ${profiles.length} entities. Average behavioral deviation score: ${avgBehavior}/100. ${escalating} entities exhibit ESCALATING threat trajectories. ${flagged} entities carry active behavioral flags. Communication frequency, timing anomalies, and operational routine deviations have been quantified.`
          : 'Behavioral analysis pending. Entities must be extracted and relationships mapped before behavioral profiling.',
        metrics: [
          { label: 'Profiles', value: profiles.length },
          { label: 'Avg Score', value: `${avgBehavior}/100` },
          { label: 'Escalating', value: escalating },
          { label: 'Flagged', value: flagged },
        ],
      };
    }
    case 4: { // Anomaly Detection
      const critical = anomalies.filter(a => a.severity === 'CRITICAL').length;
      const high = anomalies.filter(a => a.severity === 'HIGH').length;
      const medium = anomalies.filter(a => a.severity === 'MEDIUM').length;
      return {
        title: 'Anomaly Detection Complete',
        explanation: anomalies.length > 0
          ? `Anomaly detection scan resolved ${anomalies.length} operational anomalies. Severity distribution: ${critical} CRITICAL, ${high} HIGH, ${medium} MEDIUM. Each anomaly includes confidence scoring and affected entity mapping. ${critical > 0 ? 'CRITICAL anomalies require immediate investigative attention.' : 'No CRITICAL-severity anomalies detected in this cycle.'}`
          : 'No anomalies detected. This may indicate clean operational data or insufficient source material for behavioral baseline establishment.',
        metrics: [
          { label: 'Total', value: anomalies.length },
          { label: 'Critical', value: critical },
          { label: 'High', value: high },
          { label: 'Medium', value: medium },
        ],
      };
    }
    case 5: { // Pattern Detection
      const patTypes = [...new Set((operationalPatterns || []).map(p => p.type))];
      const critPats = (operationalPatterns || []).filter(p => p.severity === 'CRITICAL').length;
      return {
        title: 'Pattern Detection Complete',
        explanation: (operationalPatterns || []).length > 0
          ? `Structural analysis resolved ${operationalPatterns.length} operational threat patterns across ${patTypes.length} distinct topology types: ${patTypes.join(', ')}. ${critPats} patterns classified at CRITICAL severity. These patterns reveal coordinated infrastructure usage, command hierarchies, and communication architectures within the threat network.`
          : 'No structural patterns detected in the current dataset. Pattern detection requires sufficient entity and relationship data to identify topological signatures.',
        metrics: [
          { label: 'Patterns', value: (operationalPatterns || []).length },
          { label: 'Types', value: patTypes.length },
          { label: 'Critical', value: critPats },
        ],
      };
    }
    case 6: { // AI Reasoning
      const riskAssess = aiInsights?.riskAssessment || {};
      return {
        title: 'AI Investigation Reasoning Complete',
        explanation: aiInsights
          ? `AI reasoning engine has synthesized all intelligence streams into an operational assessment. Overall threat level: ${riskAssess.overallLevel || 'UNKNOWN'}. Average network risk: ${riskAssess.avgRisk || 0}/100. Maximum entity risk: ${riskAssess.maxRisk || 0}/100. Suspicious link ratio: ${riskAssess.suspRatio || 0}%. The reasoning engine has correlated behavioral profiles, anomaly signatures, and structural patterns to produce predictive threat indicators.`
          : 'AI reasoning engine awaiting upstream analysis completion. All prior investigation steps must complete before reasoning synthesis.',
        metrics: [
          { label: 'Threat Level', value: riskAssess.overallLevel || 'PENDING' },
          { label: 'Avg Risk', value: `${riskAssess.avgRisk || 0}/100` },
          { label: 'Max Risk', value: `${riskAssess.maxRisk || 0}/100` },
          { label: 'Susp. Ratio', value: `${riskAssess.suspRatio || 0}%` },
        ],
      };
    }
    case 7: { // Recommended Actions
      return {
        title: 'Operational Recommendations Generated',
        explanation: 'The investigation pipeline has completed all analytical phases. Recommended actions have been generated based on entity risk profiles, behavioral escalation patterns, detected anomalies, and structural threat topologies. Each recommendation includes confidence scoring, priority classification, and operational reasoning to guide next steps.',
        metrics: [
          { label: 'Status', value: 'COMPLETE' },
        ],
      };
    }
    default:
      return { title: 'Unknown Step', explanation: 'Step not recognized.', metrics: [] };
  }
}

/**
 * Generates the full text investigation report for export.
 */
export function generateInvestigationReport(entities, relationships, anomalies, patterns, clusters, behaviorProfiles, aiInsights) {
  const summary = generateExecutiveSummary(entities, relationships, anomalies, patterns, clusters, behaviorProfiles);
  const scorecard = generateCaseScorecard(entities, relationships, anomalies, behaviorProfiles, clusters);
  const recommendations = generateRecommendedActions(entities, relationships, anomalies, patterns, clusters, behaviorProfiles);

  const lines = [
    '╔══════════════════════════════════════════════════════════╗',
    '║         NOCTIS V2 — INVESTIGATION REPORT                ║',
    '╚══════════════════════════════════════════════════════════╝',
    '',
    '── EXECUTIVE SUMMARY ──',
    summary.summaryText,
    '',
    '── KEY FINDINGS ──',
    ...summary.keyFindings.map((f, i) => `  ${i + 1}. ${f}`),
    '',
    '── CASE SCORECARD ──',
    `  Entities:              ${scorecard.entityCount}`,
    `  Relationships:         ${scorecard.relationshipCount}`,
    `  Anomalies:             ${scorecard.anomalyCount}`,
    `  Behavior Risk Score:   ${scorecard.behaviorRiskScore}/100`,
    `  Threat Level:          ${scorecard.threatLevel}`,
    `  Investigation Conf.:   ${scorecard.investigationConfidence}%`,
    `  Case Complexity:       ${scorecard.caseComplexity}`,
    '',
    '── MOST IMPORTANT ENTITY ──',
    summary.mostImportantEntity
      ? `  ${summary.mostImportantEntity.name} (${summary.mostImportantEntity.type}) — Risk: ${summary.mostImportantEntity.risk}/100`
      : '  None identified.',
    '',
    '── MOST SUSPICIOUS RELATIONSHIP ──',
    `  ${summary.mostSuspiciousRelationship}`,
    '',
    '── CRITICAL CLUSTER ──',
    summary.criticalCluster
      ? `  ${summary.criticalCluster.name} — ${summary.criticalCluster.memberCount} members, Hub: ${summary.criticalCluster.hub}, Threat: ${summary.criticalCluster.threatLevel}`
      : '  No clusters detected.',
    '',
    '── OPERATIONAL CONCERNS ──',
    ...summary.operationalConcerns.map((c, i) => `  ${i + 1}. ${c}`),
    '',
    '── RECOMMENDED ACTIONS ──',
    ...recommendations.map((r, i) => [
      `  ${i + 1}. [${r.priority}] ${r.title}`,
      `     Confidence: ${r.confidence}%`,
      `     ${r.reasoning}`,
    ]).flat(),
    '',
    '── ANOMALIES ──',
    ...anomalies.slice(0, 10).map((a, i) => `  ${i + 1}. [${a.severity}] ${a.title} — Confidence: ${a.confidence}%`),
    '',
    '── END OF REPORT ──',
    `  Generated: ${new Date().toISOString()}`,
    `  System: NOCTIS V2 Investigation Engine`,
  ];

  return lines.join('\n');
}
