import { useMemo } from 'react';
import { motion } from 'framer-motion';
import useStore from '../../store/investigationStore';
import { ShieldAlert, AlertTriangle, Cpu, TrendingUp, Users, Network, Compass, Sparkles } from 'lucide-react';
import { ENTITY_COLORS } from '../../data/sampleCase';

export default function FlowView() {
  const { 
    entities, 
    relationships, 
    events, 
    aiInsights, 
    anomalies = [], 
    clusters = [], 
    operationalPatterns = [], 
    setSelectedEntity 
  } = useStore();

  const sortedEvents = useMemo(() =>
    [...events].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
    [events]
  );

  const suspiciousRels = relationships.filter(r => r.suspicious).sort((a, b) => b.weight - a.weight);

  if (entities.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black font-mono p-8 select-none">
        <div className="w-12 h-12 rounded border border-[#ff1e1e]/30 bg-[#ff1e1e]/5 flex items-center justify-center mb-4 text-[#ff1e1e] animate-pulse">
          <ShieldAlert size={20} />
        </div>
        <span className="text-xs text-white font-bold tracking-widest uppercase mb-1">AI Investigation Console Offline</span>
        <span className="text-[10px] text-gray-500 max-w-md text-center leading-relaxed">
          No operational intelligence data currently residing in system memory. Ingest raw intelligence logs or load the tactical sample case to initialize system diagnostics.
        </span>
      </div>
    );
  }

  // Get metrics
  const avgRisk = entities.length > 0 ? Math.round(entities.reduce((s, e) => s + e.risk, 0) / entities.length) : 0;
  const criticalAnomCount = anomalies.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH').length;
  const suspLinkRatio = relationships.length > 0 
    ? Math.round((relationships.filter(r => r.suspicious).length / relationships.length) * 100) 
    : 0;

  // Decide overall status
  const isCritical = anomalies.some(a => a.severity === 'CRITICAL') || avgRisk >= 65;

  return (
    <div className="w-full h-full bg-black overflow-y-auto p-5 select-none font-mono text-gray-400">
      
      {/* 1. STATUS HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border border-[#222222] bg-[#050505] p-4 rounded mb-5 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#ff1e1e] animate-ping" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">AI Investigation Console (V2)</h2>
          </div>
          <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Multi-Dimensional Behavioral intelligence, anomalies & routing</p>
        </div>

        {/* Tactical Counters */}
        <div className="flex flex-wrap gap-4 text-[10px]">
          <div className="flex flex-col">
            <span className="text-gray-500 text-[8px] uppercase tracking-wider font-semibold">OVERALL THREAT</span>
            <span className={`font-bold ${isCritical ? 'text-[#ff1e1e]' : 'text-noctis-warning'}`}>
              {isCritical ? 'CRITICAL VECTOR' : 'MEDIUM RISK'}
            </span>
          </div>
          <div className="w-px h-6 bg-[#222222] hidden sm:block" />
          <div className="flex flex-col">
            <span className="text-gray-500 text-[8px] uppercase tracking-wider font-semibold">AVG NODE RISK</span>
            <span className="font-bold text-white">{avgRisk}%</span>
          </div>
          <div className="w-px h-6 bg-[#222222] hidden sm:block" />
          <div className="flex flex-col">
            <span className="text-gray-500 text-[8px] uppercase tracking-wider font-semibold">ACTIVE ANOMALIES</span>
            <span className="font-bold text-[#ff1e1e]">{anomalies.length} ({criticalAnomCount} CRIT)</span>
          </div>
          <div className="w-px h-6 bg-[#222222] hidden sm:block" />
          <div className="flex flex-col">
            <span className="text-gray-500 text-[8px] uppercase tracking-wider font-semibold">SUSP LINK RATIO</span>
            <span className="font-bold text-white">{suspLinkRatio}%</span>
          </div>
          <div className="w-px h-6 bg-[#222222] hidden sm:block" />
          <div className="flex flex-col">
            <span className="text-gray-500 text-[8px] uppercase tracking-wider font-semibold">NETWORK CELLS</span>
            <span className="font-bold text-white">{clusters.length} Detected</span>
          </div>
        </div>
      </div>

      {/* 2. EXECUTIVE INTELLIGENCE BRIEF */}
      {aiInsights && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-[#ff1e1e]/30 bg-[#ff1e1e]/5 p-4 rounded mb-5 relative overflow-hidden"
        >
          {/* Tactical crosshair borders */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#ff1e1e]" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#ff1e1e]" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#ff1e1e]" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#ff1e1e]" />

          <div className="flex items-center gap-2 mb-2 text-[10px] uppercase font-bold text-[#ff1e1e]">
            <Cpu size={12} className="animate-spin text-[#ff1e1e]" style={{ animationDuration: '4s' }} />
            <span>EXECUTIVE OPERATIONAL BRIEFING</span>
          </div>
          <div className="text-white text-xs leading-relaxed text-justify font-mono">
            {aiInsights.summary}
          </div>
        </motion.div>
      )}

      {/* 3. THREE GRID PANELS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
        
        {/* PANEL A: Suspicious Behavior & Anomaly Log */}
        <div className="border border-[#222222] bg-[#020202] rounded p-4 flex flex-col h-[400px]">
          <div className="flex items-center gap-2 border-b border-[#111111] pb-2 mb-3">
            <AlertTriangle size={12} className="text-[#ff1e1e]" />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider flex-1">Suspicious Anomalies</span>
            <span className="text-[9px] text-gray-500 font-bold">{anomalies.length} Total</span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {anomalies.length === 0 ? (
              <div className="text-gray-600 text-xs py-4 text-center">No anomalies registered.</div>
            ) : (
              anomalies.map((anom) => (
                <div key={anom.id} className="border-l-2 border-[#ff1e1e] pl-2 py-1.5 bg-black/40 text-[10px] space-y-1">
                  <div className="flex justify-between items-center text-[8px]">
                    <span className="text-[#ff1e1e] font-bold">[{anom.severity}] CONF: {anom.confidence}%</span>
                    <span className="text-gray-600">{new Date(anom.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-white font-bold text-[11px]">{anom.title}</div>
                  <div className="text-gray-400 leading-normal">{anom.explanation}</div>
                  {anom.affectedEntities?.length > 0 && (
                    <div className="text-[8px] text-[#00bcd4] flex flex-wrap gap-1 items-center mt-1">
                      <span className="text-gray-600 font-semibold uppercase">Affected:</span>
                      {anom.affectedEntities.map(id => {
                        const ent = entities.find(e => e.id === id);
                        return (
                          <span 
                            key={id} 
                            onClick={() => ent && setSelectedEntity(ent)}
                            className="bg-[#00bcd4]/10 border border-[#00bcd4]/20 px-1 py-0.2 rounded hover:bg-[#00bcd4]/20 cursor-pointer"
                          >
                            {ent?.name || id}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* PANEL B: Coordinated Networks & Hubs */}
        <div className="border border-[#222222] bg-[#020202] rounded p-4 flex flex-col h-[400px]">
          <div className="flex items-center gap-2 border-b border-[#111111] pb-2 mb-3">
            <Users size={12} className="text-[#ff1e1e]" />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider flex-1">Coordinated Cells</span>
            <span className="text-[9px] text-gray-500 font-bold">{clusters.length} Cells</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {clusters.length === 0 ? (
              <div className="text-gray-600 text-xs py-4 text-center">No topology groups resolved.</div>
            ) : (
              clusters.map((cluster) => (
                <div key={cluster.id} className="p-2 border border-[#222222] bg-[#050505] space-y-2 hover:border-[#ff1e1e]/20 transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold text-[11px] uppercase tracking-wider">{cluster.name}</span>
                    <span className={`text-[7px] font-semibold px-1 rounded uppercase ${
                      cluster.threatLevel === 'CRITICAL' || cluster.threatLevel === 'HIGH' ? 'bg-[#ff1e1e]/15 text-[#ff1e1e]' : 'bg-gray-500/10 text-gray-400'
                    }`}>
                      {cluster.threatLevel}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[8px] text-gray-500">
                    <div>CLASSIFICATION: <span className="text-white font-semibold">{cluster.classification}</span></div>
                    <div>HUB/COORDINATOR: <span className="text-[#00bcd4] font-semibold">{cluster.hubName || cluster.hub}</span></div>
                    <div>DENSITY SCORE: <span className="text-white">{Math.round(cluster.density * 100)}%</span></div>
                    <div>SUSPICIOUS RATIO: <span className="text-[#ff1e1e] font-semibold">{Math.round(cluster.suspiciousLinkRatio * 100)}%</span></div>
                  </div>

                  <div className="border-t border-[#111111] pt-1 text-[8px] text-gray-500">
                    <span className="font-semibold uppercase block mb-0.5">Cell Members ({cluster.entities.length}):</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {cluster.entities.map(id => {
                        const ent = entities.find(e => e.id === id);
                        return (
                          <span 
                            key={id}
                            onClick={() => ent && setSelectedEntity(ent)}
                            className="bg-black border border-[#222222] px-1 py-0.2 rounded hover:border-[#ff1e1e]/30 cursor-pointer text-gray-300"
                          >
                            {ent?.name || id}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PANEL C: Structural Threat Patterns */}
        <div className="border border-[#222222] bg-[#020202] rounded p-4 flex flex-col h-[400px]">
          <div className="flex items-center gap-2 border-b border-[#111111] pb-2 mb-3">
            <Network size={12} className="text-[#ff1e1e]" />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider flex-1">Structural Flow Signatures</span>
            <span className="text-[9px] text-gray-500 font-bold">{operationalPatterns.length} Signatures</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {operationalPatterns.length === 0 ? (
              <div className="text-gray-600 text-xs py-4 text-center">No structural flow layouts detected.</div>
            ) : (
              operationalPatterns.map((pat) => (
                <div key={pat.id} className="p-2 border border-[#222222] bg-[#050505] space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold text-[11px]">{pat.name}</span>
                    <span className={`text-[7px] px-1 rounded uppercase font-semibold ${
                      pat.severity === 'CRITICAL' || pat.severity === 'HIGH' ? 'bg-[#ff1e1e]/15 text-[#ff1e1e]' : 'bg-gray-500/10 text-gray-400'
                    }`}>
                      {pat.severity}
                    </span>
                  </div>
                  <div className="text-[9px] text-gray-400 leading-normal">{pat.description}</div>
                  
                  {/* Flow chart representation */}
                  <div className="border-t border-[#111111] pt-1.5 mt-1.5">
                    <div className="text-[7px] text-gray-500 uppercase font-semibold mb-1">INVOLVED TRAFFIC WAVE</div>
                    <div className="flex flex-wrap items-center gap-1">
                      {pat.involvedEntities.map((id, index) => {
                        const ent = entities.find(e => e.id === id);
                        return (
                          <div key={id} className="flex items-center gap-1 text-[8px]">
                            <span 
                              onClick={() => ent && setSelectedEntity(ent)}
                              className="bg-black border border-[#ff1e1e]/10 px-1 py-0.2 rounded hover:border-[#ff1e1e]/30 cursor-pointer text-gray-300 font-mono"
                            >
                              {ent?.name || id}
                            </span>
                            {index < pat.involvedEntities.length - 1 && (
                              <span className="text-[#ff1e1e] font-bold">➔</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* 4. PREDICTIVE INDICATORS SECTION (V3 Prep) */}
      <div className="border border-[#222222] bg-[#020202] rounded p-4">
        <div className="flex items-center gap-2 border-b border-[#111111] pb-2 mb-3">
          <Sparkles size={12} className="text-[#ff1e1e] animate-pulse" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">Predictive Threat Intelligence (V3 Memory Layer)</span>
          <span className="text-[8px] bg-[#00bcd4]/10 border border-[#00bcd4]/30 text-[#00bcd4] px-1 rounded uppercase tracking-widest font-bold">PROJECTION</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {aiInsights?.predictions?.length === 0 ? (
            <div className="text-gray-600 text-xs py-2 text-center col-span-4">No forecasting profiles loaded.</div>
          ) : (
            aiInsights?.predictions?.map((pred, i) => (
              <div key={pred.id || i} className="p-3 border border-[#1c1c1c] bg-[#050505] rounded flex flex-col justify-between space-y-2 hover:border-[#ff1e1e]/25 transition-all">
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="text-white font-bold text-[10px] leading-tight max-w-[130px] uppercase">{pred.title}</span>
                    <span className={`text-[7px] px-1 rounded uppercase font-semibold ${
                      pred.severity === 'CRITICAL' || pred.severity === 'HIGH' ? 'bg-[#ff1e1e]/15 text-[#ff1e1e]' : 'bg-gray-500/10 text-gray-400'
                    }`}>
                      {pred.severity}
                    </span>
                  </div>
                  <p className="text-[9px] text-gray-400 leading-normal">{pred.description}</p>
                </div>
                
                {/* Confidence Bar */}
                <div className="border-t border-[#151515] pt-2 mt-1">
                  <div className="flex justify-between items-center text-[7px] text-gray-500 font-semibold mb-0.5">
                    <span>PROBABILITY OF OCCURRENCE</span>
                    <span className="text-[#00bcd4]">{pred.confidence}%</span>
                  </div>
                  <div className="w-full h-1 bg-[#111111] rounded overflow-hidden">
                    <div className="h-full bg-[#00bcd4]" style={{ width: `${pred.confidence}%` }} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
