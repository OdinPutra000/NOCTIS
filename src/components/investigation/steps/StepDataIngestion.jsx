import { motion } from 'framer-motion';
import useStore from '../../../store/investigationStore';
import { generateStepInsight } from '../../../engine/investigationEngine';

export default function StepDataIngestion() {
  const { rawIntelligence, entities, relationships, anomalies, behaviorProfiles, operationalPatterns, clusters, aiInsights } = useStore();
  const storeSnapshot = { entities, relationships, anomalies, behaviorProfiles, operationalPatterns, clusters, aiInsights, rawIntelligence };
  const insight = generateStepInsight(0, storeSnapshot);

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
            <span className="text-xs font-mono font-bold text-[#e5e5e5]">{metric.value}</span>
          </div>
        ))}
      </div>

      {/* Detailed Data */}
      <div className="flex-1 flex flex-col min-h-[200px]">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] text-[#9ca3af] font-bold uppercase tracking-widest">Raw Intelligence Payload</span>
        </div>
        <div className="flex-1 bg-[#050505] border border-[#1a1a1a] p-3 rounded-sm overflow-y-auto">
          {rawIntelligence ? (
            <pre className="text-[10px] text-[#a3e635] font-mono whitespace-pre-wrap leading-relaxed">
              {rawIntelligence}
            </pre>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-[#6b7280]">
              <span className="text-2xl">📥</span>
              <span className="text-[11px] font-mono">NO DATA INGESTED</span>
              <span className="text-[9px]">Load a case or upload files to begin.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
