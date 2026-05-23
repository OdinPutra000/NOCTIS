import { useMemo } from 'react';
import { motion } from 'framer-motion';
import useStore from '../../store/investigationStore';
import { getRiskColor, getRiskLevel } from '../../engine/riskEngine';
import { Activity, ShieldAlert, TrendingUp, Compass, Globe, Info, Zap, BarChart2 } from 'lucide-react';

export default function BehaviorPanel() {
  const { selectedEntity, entities, behaviorProfiles, anomalies, clusters } = useStore();

  const activeProfile = useMemo(() => {
    if (!selectedEntity) return null;
    return behaviorProfiles[selectedEntity.id] || null;
  }, [selectedEntity, behaviorProfiles]);

  // If no entity is selected, show Case-wide Behavioral Intelligence summary
  if (!selectedEntity) {
    // Calculate global metrics
    const profilesList = Object.values(behaviorProfiles);
    const avgScore = profilesList.length > 0
      ? Math.round(profilesList.reduce((sum, p) => sum + p.behaviorScore, 0) / profilesList.length)
      : 0;

    const criticalCount = profilesList.filter(p => p.behaviorScore >= 80).length;
    const elevatedCount = profilesList.filter(p => p.behaviorScore >= 55 && p.behaviorScore < 80).length;
    const moderateCount = profilesList.filter(p => p.behaviorScore >= 30 && p.behaviorScore < 55).length;
    const normalCount = profilesList.filter(p => p.behaviorScore < 30).length;

    // Collect all unique behavior flags active in the case
    const allFlags = Array.from(new Set(profilesList.flatMap(p => p.behaviorFlags || [])));

    return (
      <div className="p-4 font-mono text-[#d1d5db]" id="global-behavior-intelligence">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5 border-b border-[#111111] pb-2 mb-3">
          <Activity size={13} className="text-[#ff1e1e]" /> CASE BEHAVIOR METRICS
        </h3>

        {/* Global Stats Gauge */}
        <div className="mb-5 p-3.5 rounded border border-[#111111] bg-[#050505] text-center">
          <span className="text-[9px] uppercase tracking-wider text-[#6b7280] block mb-1">Average Behavior Suspicion</span>
          <div className="text-2xl font-bold font-mono text-[#ff1e1e]">{avgScore}<span className="text-xs text-[#5b5b5b]">/100</span></div>
          
          <div className="w-full h-1 bg-[#111] rounded-full overflow-hidden mt-2 max-w-[80%] mx-auto">
            <div className="h-full bg-[#ff1e1e]" style={{ width: `${avgScore}%` }} />
          </div>
        </div>

        {/* Threat Level Categories */}
        <div className="mb-4">
          <span className="text-[9px] uppercase tracking-widest text-[#5b5b5b] font-bold block mb-2">Subject Threat Matrix</span>
          <div className="grid grid-cols-2 gap-2 text-[9px]">
            <div className="p-2 border border-[#111] bg-[#0a0a0a] rounded">
              <span className="text-[#ff1e1e] font-bold block">CRITICAL (80+)</span>
              <span className="text-lg font-bold text-white mt-1 block">{criticalCount} <span className="text-[8px] text-[#5b5b5b] font-normal">entities</span></span>
            </div>
            <div className="p-2 border border-[#111] bg-[#0a0a0a] rounded">
              <span className="text-orange-400 font-bold block">ELEVATED (55+)</span>
              <span className="text-lg font-bold text-white mt-1 block">{elevatedCount} <span className="text-[8px] text-[#5b5b5b] font-normal">entities</span></span>
            </div>
            <div className="p-2 border border-[#111] bg-[#0a0a0a] rounded">
              <span className="text-yellow-500 font-bold block">MODERATE (30+)</span>
              <span className="text-lg font-bold text-white mt-1 block">{moderateCount} <span className="text-[8px] text-[#5b5b5b] font-normal">entities</span></span>
            </div>
            <div className="p-2 border border-[#111] bg-[#0a0a0a] rounded">
              <span className="text-green-500 font-bold block">NORMAL (&lt;30)</span>
              <span className="text-lg font-bold text-white mt-1 block">{normalCount} <span className="text-[8px] text-[#5b5b5b] font-normal">entities</span></span>
            </div>
          </div>
        </div>

        {/* Active Suspicious Indicators */}
        <div className="mb-4">
          <span className="text-[9px] uppercase tracking-widest text-[#5b5b5b] font-bold block mb-2">Active Case Flags</span>
          <div className="flex flex-wrap gap-1">
            {allFlags.length === 0 ? (
              <span className="text-[9px] text-[#4b5563]">No active behavioral flags. Ingest data.</span>
            ) : (
              allFlags.map(flag => (
                <span key={flag} className="text-[8px] bg-[#ff1e1e]/10 border border-[#ff1e1e]/20 text-[#ff1e1e] px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold">
                  {flag.replace(/_/g, ' ')}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="bg-[#0a0a0a]/50 border border-[#111] p-2.5 rounded text-[8.5px] leading-relaxed text-[#8b8b8b]">
          <span className="font-bold text-white flex items-center gap-1 uppercase mb-1">
            <Info size={10} className="text-blue-400" /> Behavioral Audit Information
          </span>
          Select any subject or entity node from the tactical graph or left entity list to run individual operational audits, score dimensions, and review narrative intelligence profiles.
        </div>
      </div>
    );
  }

  // Individual Subject Behavior Profile UI
  const p = activeProfile;
  const e = selectedEntity;
  const scoreColor = getRiskColor(p ? p.behaviorScore : 0);
  const trendSymbol = p?.trend === 'ESCALATING' ? '↑' : p?.trend === 'DE_ESCALATING' ? '↓' : '→';

  // Find entity specific anomalies
  const entityAnomalies = anomalies.filter(an => an.affectedEntities.includes(e.id));
  const entityCluster = clusters.find(cl => cl.entities.includes(e.id));

  // Simulated sparkline coordinates based on timeline event distributions
  const sparkPoints = useMemo(() => {
    if (!p) return [];
    // generate historical risk progression
    const baseline = p.behaviorScore * 0.5;
    const steps = [baseline, baseline * 1.2, p.behaviorScore * 0.8, p.behaviorScore * 0.9, p.behaviorScore];
    return steps.map((s, idx) => {
      const x = idx * 25;
      const y = 30 - (s / 100) * 28;
      return `${x},${y}`;
    }).join(' ');
  }, [p]);

  return (
    <motion.div
      key={e.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 font-mono text-[#d1d5db]"
      id="entity-behavior-intelligence"
    >
      {/* Header */}
      <div className="border-b border-[#111111] pb-2.5 mb-4">
        <span className="text-[8px] text-[#5b5b5b] font-bold block uppercase tracking-wider">BEHAVIOR PROFILE</span>
        <h3 className="text-xs font-bold text-white uppercase truncate mt-0.5">{e.name}</h3>
        
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-[8px] bg-black border border-[#222] text-[#8b8b8b] px-1 py-0.5 rounded font-bold uppercase tracking-wider">
            ID: {e.id}
          </span>
          {entityCluster && (
            <span className="text-[8px] bg-[#ff1e1e]/10 border border-[#ff1e1e]/30 text-[#ff1e1e] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
              CELL: {entityCluster.name}
            </span>
          )}
        </div>
      </div>

      {/* Behavior suspicion score */}
      <div className="mb-4 p-3 rounded border border-[#111111] bg-[#050505] flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-wider text-[#6b7280]">Suspicion Score</span>
          <span className="text-lg font-bold font-mono mt-0.5" style={{ color: scoreColor }}>
            {p ? p.behaviorScore : 0}<span className="text-xs text-[#4b5563]">/100</span>
          </span>
          <span className="text-[8px] text-[#5b5b5b] mt-0.5 uppercase tracking-wide">
            {p ? p.trend : 'STABLE'} TREND {trendSymbol}
          </span>
        </div>

        {/* Mini Sparkline Chart */}
        <div className="flex flex-col items-end gap-1">
          <span className="text-[7.5px] uppercase tracking-widest text-[#5b5b5b]">RISK DIVERGENCE</span>
          <svg className="w-24 h-8 bg-[#000000] border border-[#111] rounded p-1 overflow-visible" viewBox="0 0 100 30">
            <polyline
              fill="none"
              stroke={scoreColor}
              strokeWidth="1.5"
              points={sparkPoints}
            />
            {/* Pulsing endpoint */}
            <circle cx="100" cy={30 - ((p ? p.behaviorScore : 0) / 100) * 28} r="2" fill="#ff1e1e" className="animate-pulse" />
          </svg>
        </div>
      </div>

      {/* Narrative Assessment report */}
      {p?.assessment && (
        <div className="mb-4 p-2.5 rounded border border-[#ff1e1e]/15 bg-[#080202] text-[9.5px] leading-relaxed text-[#b5b5b5]">
          <span className="font-bold text-white flex items-center gap-1 uppercase tracking-wider mb-1">
            <Compass size={10} className="text-[#ff1e1e]" /> Core Behavioral Audit
          </span>
          {p.assessment}
        </div>
      )}

      {/* 6 Dimension analysis bar list */}
      {p?.dimensions && (
        <div className="mb-4">
          <span className="text-[9px] uppercase tracking-widest text-[#5b5b5b] font-bold block mb-2">Behavior Dimensions</span>
          <div className="space-y-2 text-[9px]">
            {Object.entries({
              'COMMUNICATION FREQ': p.dimensions.communicationFrequency,
              'OFF-HOURS TIMING': p.dimensions.activityTiming,
              'GEO DIVERGENCE': p.dimensions.locationChanges,
              'INFRASTRUCTURE REUSE': p.dimensions.infrastructureUsage,
              'LINK DIVERGENCE': p.dimensions.relationshipEvolution,
              'ROUTINE ANOMALIES': p.dimensions.operationalRoutines
            }).map(([label, val]) => (
              <div key={label} className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[8px]">
                  <span className="text-[#8b8b8b] uppercase font-bold">{label}</span>
                  <span className="font-mono text-white font-semibold">{val}/100</span>
                </div>
                <div className="w-full h-1.5 bg-[#0d0d0d] rounded-full overflow-hidden border border-[#161616]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${val}%`,
                      backgroundColor: val >= 80 ? '#ff1e1e' : val >= 55 ? '#f97316' : val >= 30 ? '#eab308' : '#10b981'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Behavioral flags specific to subject */}
      {p?.behaviorFlags && p.behaviorFlags.length > 0 && (
        <div className="mb-4">
          <span className="text-[9px] uppercase tracking-widest text-[#5b5b5b] font-bold block mb-2">Subject Flags Detected</span>
          <div className="flex flex-wrap gap-1">
            {p.behaviorFlags.map(flag => (
              <span key={flag} className="text-[8px] bg-[#ff1e1e]/10 border border-[#ff1e1e]/20 text-[#ff1e1e] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-0.5">
                <Zap size={8} /> {flag.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Anomalies Audits list */}
      <div className="mb-2">
        <span className="text-[9px] uppercase tracking-widest text-[#5b5b5b] font-bold block mb-2">
          Anomalous Indicators ({entityAnomalies.length})
        </span>
        {entityAnomalies.length === 0 ? (
          <span className="text-[9px] text-[#4b5563] italic">No active anomalies recorded on this subject.</span>
        ) : (
          <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-0.5">
            {entityAnomalies.map(an => (
              <div key={an.id} className="p-2 border border-[#111111] bg-[#030303] rounded text-[8.5px]">
                <div className="flex justify-between items-center text-[8.5px] font-bold uppercase text-[#ff1e1e] mb-1">
                  <span>⚠️ {an.title}</span>
                  <span className="bg-[#ff1e1e]/15 px-1 py-0.2 rounded border border-[#ff1e1e]/20">SEV: {an.severity}</span>
                </div>
                <p className="text-[#a5a5a5] mt-0.5 leading-snug">{an.explanation}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
