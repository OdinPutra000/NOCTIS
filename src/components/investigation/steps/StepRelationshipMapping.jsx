import { motion } from 'framer-motion';
import useStore from '../../../store/investigationStore';
import { generateStepInsight } from '../../../engine/investigationEngine';

export default function StepRelationshipMapping() {
  const { rawIntelligence, entities, relationships, anomalies, behaviorProfiles, operationalPatterns, clusters, aiInsights } = useStore();
  const storeSnapshot = { entities, relationships, anomalies, behaviorProfiles, operationalPatterns, clusters, aiInsights, rawIntelligence };
  const insight = generateStepInsight(2, storeSnapshot);

  const typeCounts = relationships.reduce((acc, rel) => {
    acc[rel.type] = (acc[rel.type] || 0) + 1;
    return acc;
  }, {});

  const typeEntries = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);

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
            <span className={`text-xs font-mono font-bold ${metric.label === 'Suspicious' && metric.value > 0 ? 'text-[#ff1e1e]' : 'text-[#e5e5e5]'}`}>
              {metric.value}
            </span>
          </div>
        ))}
      </div>

      {/* Relationship Types */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] text-[#9ca3af] font-bold uppercase tracking-widest">Link Typology</span>
        </div>
        <div className="bg-[#050505] border border-[#1a1a1a] p-4 rounded-sm flex flex-col gap-3">
          {typeEntries.length > 0 ? (
            typeEntries.map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#9ca3af] uppercase">{type.replace(/_/g, ' ')}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-1.5 bg-[#111] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#00bcd4]" 
                      style={{ width: `${(count / relationships.length) * 100}%` }} 
                    />
                  </div>
                  <span className="text-[10px] font-mono text-white w-6 text-right">{count}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-[10px] text-[#555] font-mono text-center py-4">NO LINKS DETECTED</div>
          )}
        </div>
      </div>
    </div>
  );
}
