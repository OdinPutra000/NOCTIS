import { motion } from 'framer-motion';
import useStore from '../../../store/investigationStore';
import { generateStepInsight } from '../../../engine/investigationEngine';

export default function StepAnomalyDetection() {
  const { rawIntelligence, entities, relationships, anomalies, behaviorProfiles, operationalPatterns, clusters, aiInsights } = useStore();
  const storeSnapshot = { entities, relationships, anomalies, behaviorProfiles, operationalPatterns, clusters, aiInsights, rawIntelligence };
  const insight = generateStepInsight(4, storeSnapshot);

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
              metric.label === 'Critical' && metric.value > 0 ? 'text-[#ff1e1e]' : 
              metric.label === 'High' && metric.value > 0 ? 'text-[#f59e0b]' : 
              'text-[#e5e5e5]'
            }`}>{metric.value}</span>
          </div>
        ))}
      </div>

      {/* Anomalies List */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] text-[#9ca3af] font-bold uppercase tracking-widest">Detected Anomalies</span>
        </div>
        <div className="flex flex-col gap-2">
          {anomalies.length > 0 ? anomalies.map((anom, i) => {
            const isCritical = anom.severity === 'CRITICAL';
            const isHigh = anom.severity === 'HIGH';
            
            return (
              <div key={anom.id || i} className={`bg-[#050505] border p-3 rounded-sm flex flex-col gap-2 ${
                isCritical ? 'border-[#ff1e1e]/30' : isHigh ? 'border-[#f59e0b]/30' : 'border-[#1a1a1a]'
              }`}>
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-white">{anom.title}</span>
                    <span className="text-[9px] text-[#6b7280] font-mono">Affected Entities: {anom.affectedEntities?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded ${
                      isCritical ? 'bg-[#ff1e1e]/10 text-[#ff1e1e] border border-[#ff1e1e]/20' :
                      isHigh ? 'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20' :
                      'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20'
                    }`}>
                      {anom.severity}
                    </span>
                    <span className="text-[9px] text-[#555] font-mono">{anom.confidence}% CONF</span>
                  </div>
                </div>
                <p className="text-[10px] text-[#9ca3af] leading-relaxed mt-1">
                  {anom.explanation}
                </p>
              </div>
            );
          }) : (
            <div className="bg-[#050505] border border-[#1a1a1a] p-6 rounded-sm text-center flex flex-col gap-2 items-center">
              <span className="text-xl">✅</span>
              <span className="text-[10px] text-[#555] font-mono">NO ANOMALIES DETECTED</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
