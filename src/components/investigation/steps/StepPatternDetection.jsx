import { motion } from 'framer-motion';
import useStore from '../../../store/investigationStore';
import { generateStepInsight } from '../../../engine/investigationEngine';

export default function StepPatternDetection() {
  const { rawIntelligence, entities, relationships, anomalies, behaviorProfiles, operationalPatterns, clusters, aiInsights } = useStore();
  const storeSnapshot = { entities, relationships, anomalies, behaviorProfiles, operationalPatterns, clusters, aiInsights, rawIntelligence };
  const insight = generateStepInsight(5, storeSnapshot);

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
      <div className="grid grid-cols-3 gap-3">
        {insight.metrics.map((metric, i) => (
          <div key={i} className="bg-[#0a0a0a] border border-[#222] p-3 rounded-sm flex flex-col gap-1">
            <span className="text-[9px] text-[#6b7280] uppercase tracking-widest">{metric.label}</span>
            <span className={`text-xs font-mono font-bold ${
              metric.label === 'Critical' && metric.value > 0 ? 'text-[#ff1e1e]' : 'text-[#e5e5e5]'
            }`}>{metric.value}</span>
          </div>
        ))}
      </div>

      {/* Patterns List */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] text-[#9ca3af] font-bold uppercase tracking-widest">Structural Topologies</span>
        </div>
        <div className="flex flex-col gap-2">
          {(operationalPatterns || []).length > 0 ? operationalPatterns.map((pat, i) => {
            const isCritical = pat.severity === 'CRITICAL';
            
            return (
              <div key={pat.id || i} className={`bg-[#050505] border p-3 rounded-sm flex flex-col gap-2 ${
                isCritical ? 'border-[#ff1e1e]/30' : 'border-[#1a1a1a]'
              }`}>
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{pat.name}</span>
                      <span className="text-[8px] bg-[#222] text-[#9ca3af] px-1 rounded font-mono uppercase">{pat.type.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="text-[9px] text-[#6b7280] font-mono">Involved Nodes: {pat.involvedEntities?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded ${
                      isCritical ? 'bg-[#ff1e1e]/10 text-[#ff1e1e] border border-[#ff1e1e]/20' :
                      'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20'
                    }`}>
                      {pat.severity}
                    </span>
                    <span className="text-[9px] text-[#555] font-mono">{pat.confidence}% CONF</span>
                  </div>
                </div>
                <p className="text-[10px] text-[#9ca3af] leading-relaxed mt-1">
                  {pat.description}
                </p>
                <div className="text-[8px] text-[#00bcd4] font-mono mt-1 truncate">
                  NODES: {(pat.involvedEntities || []).map(id => entities.find(e => e.id === id)?.name || id).join(', ')}
                </div>
              </div>
            );
          }) : (
            <div className="bg-[#050505] border border-[#1a1a1a] p-6 rounded-sm text-center flex flex-col gap-2 items-center">
              <span className="text-xl">🕸️</span>
              <span className="text-[10px] text-[#555] font-mono">NO STRUCTURAL PATTERNS DETECTED</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
