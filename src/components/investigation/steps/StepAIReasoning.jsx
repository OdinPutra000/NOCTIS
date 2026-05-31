import { motion } from 'framer-motion';
import useStore from '../../../store/investigationStore';
import { generateStepInsight } from '../../../engine/investigationEngine';

export default function StepAIReasoning() {
  const { rawIntelligence, entities, relationships, anomalies, behaviorProfiles, operationalPatterns, clusters, aiInsights } = useStore();
  const storeSnapshot = { entities, relationships, anomalies, behaviorProfiles, operationalPatterns, clusters, aiInsights, rawIntelligence };
  const insight = generateStepInsight(6, storeSnapshot);

  const riskAssess = aiInsights?.riskAssessment || {};
  const predictions = aiInsights?.predictions || [];
  const centralEntities = aiInsights?.centralEntities || [];

  return (
    <div className="p-5 flex flex-col gap-6">
      {/* Assessment Panel */}
      <div className="bg-[#050505] border border-[#1a1a1a] rounded-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-[#0066ff] animate-pulse" />
          <span className="text-[10px] text-[#0066ff] font-bold uppercase tracking-widest">AI Assessment</span>
        </div>
        <p className="text-[11px] text-[#d1d5db] leading-relaxed font-sans">
          {insight.explanation}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-3">
        {insight.metrics.map((metric, i) => (
          <div key={i} className="bg-[#0a0a0a] border border-[#222] p-3 rounded-sm flex flex-col gap-1">
            <span className="text-[9px] text-[#6b7280] uppercase tracking-widest">{metric.label}</span>
            <span className={`text-xs font-mono font-bold ${
              metric.label === 'Threat Level' && metric.value === 'CRITICAL' ? 'text-[#ff1e1e]' : 
              metric.label === 'Threat Level' && metric.value === 'HIGH' ? 'text-[#f59e0b]' : 
              'text-[#e5e5e5]'
            }`}>{metric.value}</span>
          </div>
        ))}
      </div>

      {/* Executive Summary */}
      {aiInsights && (
        <>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] text-[#9ca3af] font-bold uppercase tracking-widest">Executive Summary</span>
            </div>
            <div className="bg-[#050505] border border-[#1a1a1a] p-4 rounded-sm">
              <p className="text-[11px] text-[#e5e5e5] leading-relaxed font-sans">
                {aiInsights.summary}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Predictions */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] text-[#9ca3af] font-bold uppercase tracking-widest">Threat Predictions</span>
              <div className="flex flex-col gap-2">
                {predictions.map((pred, i) => (
                  <div key={pred.id || i} className="bg-[#050505] border border-[#1a1a1a] p-3 rounded-sm flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-white">{pred.title}</span>
                      <span className="text-[9px] font-mono text-[#f59e0b]">{pred.confidence}% CONF</span>
                    </div>
                    <div className="w-full h-1 bg-[#111] rounded-full overflow-hidden">
                      <div className="h-full bg-[#f59e0b]" style={{ width: `${pred.confidence}%` }} />
                    </div>
                    <p className="text-[9px] text-[#9ca3af] leading-relaxed">
                      {pred.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Central Entities */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] text-[#9ca3af] font-bold uppercase tracking-widest">Primary Targets</span>
              <div className="flex flex-col gap-2">
                {centralEntities.length > 0 ? centralEntities.map((ent, i) => (
                  <div key={ent.id || i} className="bg-[#050505] border border-[#1a1a1a] p-3 rounded-sm flex justify-between items-center">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-white">{ent.name}</span>
                      <span className="text-[8px] font-mono text-[#6b7280] uppercase">{ent.type}</span>
                    </div>
                    <span className={`text-[10px] font-mono font-bold ${ent.risk >= 70 ? 'text-[#ff1e1e]' : 'text-[#f59e0b]'}`}>
                      {ent.risk}/100
                    </span>
                  </div>
                )) : (
                  <div className="bg-[#050505] border border-[#1a1a1a] p-4 rounded-sm text-center">
                    <span className="text-[9px] text-[#555] font-mono">NO CENTRAL ENTITIES IDENTIFIED</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
