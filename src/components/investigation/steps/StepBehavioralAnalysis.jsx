import { motion } from 'framer-motion';
import useStore from '../../../store/investigationStore';
import { generateStepInsight } from '../../../engine/investigationEngine';

export default function StepBehavioralAnalysis() {
  const { rawIntelligence, entities, relationships, anomalies, behaviorProfiles, operationalPatterns, clusters, aiInsights } = useStore();
  const storeSnapshot = { entities, relationships, anomalies, behaviorProfiles, operationalPatterns, clusters, aiInsights, rawIntelligence };
  const insight = generateStepInsight(3, storeSnapshot);

  const profiles = Object.values(behaviorProfiles || {}).sort((a, b) => b.behaviorScore - a.behaviorScore);
  const topProfiles = profiles.slice(0, 5);

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
              metric.label === 'Escalating' && metric.value > 0 ? 'text-[#ff1e1e]' : 'text-[#e5e5e5]'
            }`}>{metric.value}</span>
          </div>
        ))}
      </div>

      {/* Top Behavioral Deviations */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] text-[#9ca3af] font-bold uppercase tracking-widest">Top Behavioral Deviations</span>
        </div>
        <div className="flex flex-col gap-2">
          {topProfiles.length > 0 ? topProfiles.map((p, i) => (
            <div key={p.entityId} className="bg-[#050505] border border-[#1a1a1a] p-3 rounded-sm flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{p.name}</span>
                  <span className={`text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded ${
                    p.trend === 'ESCALATING' ? 'bg-[#ff1e1e]/10 text-[#ff1e1e] border border-[#ff1e1e]/20' : 
                    p.trend === 'DE_ESCALATING' ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20' :
                    'bg-[#555]/10 text-[#888] border border-[#333]'
                  }`}>
                    {p.trend}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-sm font-mono font-bold ${p.behaviorScore >= 70 ? 'text-[#ff1e1e]' : p.behaviorScore >= 40 ? 'text-[#f59e0b]' : 'text-[#22c55e]'}`}>
                    {p.behaviorScore}
                  </span>
                  <span className="text-[9px] text-[#555]">/100</span>
                </div>
              </div>
              
              <div className="w-full h-1 bg-[#111] rounded-full overflow-hidden">
                <div 
                  className={`h-full ${p.behaviorScore >= 70 ? 'bg-[#ff1e1e]' : p.behaviorScore >= 40 ? 'bg-[#f59e0b]' : 'bg-[#22c55e]'}`}
                  style={{ width: `${p.behaviorScore}%` }}
                />
              </div>

              <div className="flex flex-wrap gap-1 mt-1">
                {(p.behaviorFlags || []).map(f => (
                  <span key={f} className="text-[8px] bg-[#222] text-[#9ca3af] px-1.5 rounded font-mono uppercase">
                    {f.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )) : (
            <div className="bg-[#050505] border border-[#1a1a1a] p-6 rounded-sm text-center">
              <span className="text-[10px] text-[#555] font-mono">NO BEHAVIORAL PROFILES GENERATED</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
