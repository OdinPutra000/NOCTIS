import { motion } from 'framer-motion';
import useStore from '../../../store/investigationStore';
import { generateStepInsight } from '../../../engine/investigationEngine';

const ENTITY_COLORS = {
  person: '#c0392b',
  device: '#7c3aed',
  email: '#d4910a',
  phone: '#0891b2',
  ip: '#2563eb',
  domain: '#0d9488',
  location: '#16a34a',
  organization: '#b8860b',
  event: '#6b7280',
};

export default function StepEntityExtraction() {
  const { rawIntelligence, entities, relationships, anomalies, behaviorProfiles, operationalPatterns, clusters, aiInsights } = useStore();
  const storeSnapshot = { entities, relationships, anomalies, behaviorProfiles, operationalPatterns, clusters, aiInsights, rawIntelligence };
  const insight = generateStepInsight(1, storeSnapshot);

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

      {/* Prominent Total */}
      <div className="bg-[#0a0a0a] border border-[#222] p-4 flex items-center justify-between rounded-sm">
        <span className="text-[10px] text-[#9ca3af] uppercase tracking-widest">Total Entities Extracted</span>
        <span className="text-sm font-mono font-bold text-white">{entities.length}</span>
      </div>

      {/* Distribution Grid */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] text-[#9ca3af] font-bold uppercase tracking-widest">Entity Distribution</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {insight.metrics.map((metric, i) => {
            const typeKey = metric.label.toLowerCase().slice(0, -1); // remove 's'
            const color = ENTITY_COLORS[typeKey] || '#6b7280';
            return (
              <div key={i} className="bg-[#050505] border border-[#1a1a1a] p-3 flex flex-col gap-2 rounded-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: color }} />
                <span className="text-[10px] text-[#9ca3af] uppercase tracking-widest pl-2">{metric.label}</span>
                <span className="text-sm font-mono font-bold text-white pl-2" style={{ color }}>{metric.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
