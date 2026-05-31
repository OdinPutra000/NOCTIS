import { motion } from 'framer-motion';
import useStore from '../../store/investigationStore';
import { generateCaseScorecard } from '../../engine/investigationEngine';

export default function CaseScorecard() {
  const { entities, relationships, anomalies, behaviorProfiles, clusters } = useStore();
  
  const scorecard = generateCaseScorecard(entities, relationships, anomalies, behaviorProfiles, clusters);

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#ff1e1e]" />
        <span className="text-[10px] text-[#9ca3af] font-bold uppercase tracking-widest">Case Scorecard</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Metric Cards */}
        <div className="bg-[#0a0a0a] border border-[#222] p-3 rounded flex flex-col gap-1">
          <span className="text-[8px] text-[#6b7280] uppercase tracking-widest">Entities</span>
          <span className="text-sm font-mono font-bold text-[#e5e5e5]">{scorecard.entityCount}</span>
        </div>
        <div className="bg-[#0a0a0a] border border-[#222] p-3 rounded flex flex-col gap-1">
          <span className="text-[8px] text-[#6b7280] uppercase tracking-widest">Relationships</span>
          <span className="text-sm font-mono font-bold text-[#e5e5e5]">{scorecard.relationshipCount}</span>
        </div>
        
        <div className="bg-[#0a0a0a] border border-[#222] p-3 rounded flex flex-col gap-1">
          <span className="text-[8px] text-[#6b7280] uppercase tracking-widest">Anomalies</span>
          <span className={`text-sm font-mono font-bold ${scorecard.anomalyCount > 0 ? 'text-[#ff1e1e]' : 'text-[#e5e5e5]'}`}>
            {scorecard.anomalyCount}
          </span>
        </div>
        <div className="bg-[#0a0a0a] border border-[#222] p-3 rounded flex flex-col gap-1">
          <span className="text-[8px] text-[#6b7280] uppercase tracking-widest">Behavior Risk</span>
          <span className={`text-sm font-mono font-bold ${
            scorecard.behaviorRiskScore >= 55 ? 'text-[#ff1e1e]' : 
            scorecard.behaviorRiskScore >= 30 ? 'text-[#f59e0b]' : 'text-[#22c55e]'
          }`}>
            {scorecard.behaviorRiskScore}/100
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="bg-[#050505] border border-[#1a1a1a] p-3 rounded flex items-center justify-between">
          <span className="text-[9px] text-[#9ca3af] uppercase tracking-widest">Threat Level</span>
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
            scorecard.threatLevel === 'CRITICAL' ? 'bg-[#ff1e1e]/15 text-[#ff1e1e] border border-[#ff1e1e]/30' :
            scorecard.threatLevel === 'HIGH' ? 'bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30' :
            scorecard.threatLevel === 'MEDIUM' ? 'bg-[#00bcd4]/15 text-[#00bcd4] border border-[#00bcd4]/30' :
            'bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30'
          }`}>
            {scorecard.threatLevel}
          </span>
        </div>

        <div className="bg-[#050505] border border-[#1a1a1a] p-3 rounded flex items-center justify-between">
          <span className="text-[9px] text-[#9ca3af] uppercase tracking-widest">Complexity</span>
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
            scorecard.caseComplexity === 'EXTREME' ? 'bg-[#8b5cf6]/15 text-[#8b5cf6] border border-[#8b5cf6]/30' :
            scorecard.caseComplexity === 'HIGH' ? 'bg-[#ff1e1e]/15 text-[#ff1e1e] border border-[#ff1e1e]/30' :
            'bg-[#333] text-[#9ca3af] border border-[#444]'
          }`}>
            {scorecard.caseComplexity}
          </span>
        </div>

        <div className="bg-[#050505] border border-[#1a1a1a] p-3 rounded flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-[#9ca3af] uppercase tracking-widest">Confidence</span>
            <span className="text-[10px] font-mono font-bold text-white">{scorecard.investigationConfidence}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#111] rounded-full overflow-hidden">
            <div className="h-full bg-[#0066ff]" style={{ width: `${scorecard.investigationConfidence}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
