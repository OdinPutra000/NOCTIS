import { useMemo } from 'react';
import { motion } from 'framer-motion';
import useStore from '../../../store/investigationStore';
import { generateRecommendedActions, generateStepInsight } from '../../../engine/investigationEngine';

export default function StepRecommendedActions() {
  const { rawIntelligence, entities, relationships, anomalies, behaviorProfiles, operationalPatterns, clusters, aiInsights } = useStore();
  
  const storeSnapshot = { entities, relationships, anomalies, behaviorProfiles, operationalPatterns, clusters, aiInsights, rawIntelligence };
  const insight = generateStepInsight(7, storeSnapshot);

  const recommendations = useMemo(() => {
    return generateRecommendedActions(entities, relationships, anomalies, operationalPatterns, clusters, behaviorProfiles);
  }, [entities, relationships, anomalies, operationalPatterns, clusters, behaviorProfiles]);

  return (
    <div className="p-5 flex flex-col gap-6 pb-20">
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

      {/* Recommendations List */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] text-[#9ca3af] font-bold uppercase tracking-widest">Prioritized Next Actions</span>
        </div>
        
        <div className="flex flex-col gap-3">
          {recommendations.length > 0 ? recommendations.map((rec, i) => {
            const isCritical = rec.priority === 'CRITICAL';
            const isHigh = rec.priority === 'HIGH';
            const isMedium = rec.priority === 'MEDIUM';
            
            return (
              <motion.div 
                key={rec.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`bg-[#050505] border p-4 rounded-sm flex flex-col gap-3 relative overflow-hidden group hover:bg-[#0a0a0a] transition-colors ${
                  isCritical ? 'border-[#ff1e1e]/40' : isHigh ? 'border-[#f59e0b]/40' : 'border-[#1a1a1a]'
                }`}
              >
                {/* Priority Accent Line */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                  isCritical ? 'bg-[#ff1e1e]' : isHigh ? 'bg-[#f59e0b]' : isMedium ? 'bg-[#00bcd4]' : 'bg-[#6b7280]'
                }`} />
                
                <div className="flex justify-between items-start pl-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-white tracking-wide">{rec.title}</span>
                    <span className="text-[9px] font-mono text-[#888] uppercase">ACTION TYPE: {rec.actionType.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded ${
                      isCritical ? 'bg-[#ff1e1e]/15 text-[#ff1e1e] border border-[#ff1e1e]/30' :
                      isHigh ? 'bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30' :
                      isMedium ? 'bg-[#00bcd4]/15 text-[#00bcd4] border border-[#00bcd4]/30' :
                      'bg-[#222] text-[#9ca3af] border border-[#333]'
                    }`}>
                      {rec.priority}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-[#e5e5e5]">
                      {rec.confidence}%
                    </span>
                  </div>
                </div>
                
                <p className="text-[11px] text-[#d1d5db] leading-relaxed pl-2">
                  {rec.description}
                </p>
                
                <div className="mt-1 pt-3 border-t border-[#1a1a1a] pl-2 flex items-start gap-2">
                  <span className="text-[10px]">🧠</span>
                  <p className="text-[9px] text-[#6b7280] font-mono leading-relaxed">
                    <span className="text-[#9ca3af]">REASONING:</span> {rec.reasoning}
                  </p>
                </div>

                {/* Execute Button Overlay (Visual only for now) */}
                <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-[9px] font-mono bg-[#0066ff] hover:bg-[#0055dd] text-white px-3 py-1 rounded shadow-[0_0_8px_rgba(0,102,255,0.4)]">
                    EXECUTE
                  </button>
                </div>
              </motion.div>
            );
          }) : (
            <div className="bg-[#050505] border border-[#1a1a1a] p-8 rounded-sm text-center flex flex-col items-center gap-3">
              <span className="text-2xl">📋</span>
              <span className="text-[11px] text-[#555] font-mono">NO RECOMMENDATIONS GENERATED</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
