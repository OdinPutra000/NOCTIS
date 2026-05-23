import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import useStore from '../../store/investigationStore';
import { ENTITY_COLORS } from '../../data/sampleCase';
import { Activity, Clock, ShieldAlert, Award, Calendar, BarChart3, TrendingUp, Users } from 'lucide-react';

export default function TimelineView() {
  const { 
    events, 
    entities, 
    setSelectedEntity, 
    timelineIntelligence, 
    anomalies, 
    timelineMode, 
    setTimelineMode 
  } = useStore();

  const [replayIndex, setReplayIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);

  const sorted = useMemo(() =>
    [...events].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
    [events]
  );

  const startReplay = () => {
    setPlaying(true);
    setReplayIndex(0);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i >= sorted.length) {
        clearInterval(interval);
        setPlaying(false);
        setReplayIndex(-1);
        return;
      }
      setReplayIndex(i);
    }, 1200);
  };

  const severityColor = (sev) => ({
    critical: '#ff1e1e',
    high: '#f97316',
    medium: '#eab308',
    low: '#10b981',
  }[sev] || '#6b7280');

  // Generate date list for heat intensity bar
  const dateRange = useMemo(() => {
    if (sorted.length === 0) return [];
    const dates = [];
    const start = new Date(sorted[0].timestamp);
    const end = new Date(sorted[sorted.length - 1].timestamp);
    
    // Normalize to date boundaries
    const current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const limit = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    
    while (current <= limit) {
      dates.push(new Date(current).toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [sorted]);

  const heatIntensity = timelineIntelligence?.heatIntensity || {};
  const hourlyDensity = timelineIntelligence?.activityDensity?.hourly || Array(24).fill(0);
  const maxHourlyVal = Math.max(...hourlyDensity, 1);
  const spikes = timelineIntelligence?.spikes || [];
  const escalations = timelineIntelligence?.escalations || [];
  const correlatedGroups = timelineIntelligence?.correlatedGroups || [];

  if (events.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#000000]">
        <span className="font-mono text-sm text-[#4b5563]">No timeline events. Load intelligence data.</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#000000] overflow-y-auto p-5 font-mono text-[#d1d5db]" id="timeline-intelligence-engine">
      {/* Top Controls Header */}
      <div className="flex flex-col gap-4 border-b border-[#111111] pb-4 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Clock size={14} className="text-[#ff1e1e]" /> CHRONOSEQUENTIAL TIMELINE
            </h2>
            <p className="text-[9px] text-[#4b5563] mt-0.5">{sorted.length} events logged | V2 Chronology Engine Active</p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Play Timeline */}
            <button
              onClick={startReplay}
              disabled={playing}
              className="text-[9px] uppercase tracking-widest bg-[#ff1e1e]/10 border border-[#ff1e1e]/30 text-[#ff1e1e] hover:bg-[#ff1e1e]/20 transition-all px-3 py-1 rounded disabled:opacity-40"
            >
              {playing ? '▶ Running Trace...' : '▶ Replay Sequence'}
            </button>
          </div>
        </div>

        {/* Chronological Stats & Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 bg-[#050505] border border-[#111111] p-3 rounded">
          {/* Daily Heat Intensity Bar */}
          <div className="flex flex-col gap-1.5 justify-center">
            <span className="text-[8px] text-[#5b5b5b] font-bold uppercase tracking-wider flex items-center gap-1">
              <Calendar size={10} className="text-[#ff1e1e]" /> Daily Activity Heat
            </span>
            <div className="flex items-center gap-1 w-full bg-[#000000] p-1.5 border border-[#161616] rounded h-9">
              {dateRange.map(date => {
                const intensity = heatIntensity[date] || 0;
                const displayMonthDay = date.split('-').slice(1).join('/');
                return (
                  <div
                    key={date}
                    className="flex-1 h-full relative group cursor-crosshair rounded-[1px]"
                    style={{
                      backgroundColor: intensity === 0 ? '#0a0a0a' : `rgba(255, 30, 30, ${0.1 + intensity * 0.9})`,
                      border: intensity > 0 ? '1px solid rgba(255, 30, 30, 0.2)' : '1px solid #111'
                    }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-50 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-[#0a0a0a] border border-[#ff1e1e]/30 text-[8px] text-white p-1 rounded font-mono z-50 whitespace-nowrap">
                      {displayMonthDay}: {Math.round(intensity * 10)} activity rating
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mini Hourly Histogram */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[8px] text-[#5b5b5b] font-bold uppercase tracking-wider flex items-center gap-1">
              <BarChart3 size={10} className="text-[#ff1e1e]" /> Hourly Density & Off-Hours Threat
            </span>
            <div className="flex items-end justify-between gap-[2px] w-full bg-[#000000] p-1.5 border border-[#161616] rounded h-9">
              {hourlyDensity.map((count, hr) => {
                const heightPct = (count / maxHourlyVal) * 100;
                const isOffHours = hr >= 22 || hr < 6;
                return (
                  <div
                    key={hr}
                    className="flex-1 relative group cursor-help"
                    style={{ height: '100%' }}
                  >
                    {/* Bar */}
                    <div
                      className="absolute bottom-0 w-full rounded-[1px]"
                      style={{
                        height: `${Math.max(10, heightPct)}%`,
                        backgroundColor: isOffHours 
                          ? (count > 0 ? '#ff1e1e' : '#4b0c0c') 
                          : (count > 0 ? '#d4910a' : '#161616'),
                        opacity: count > 0 ? 1 : 0.2
                      }}
                    />
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-[#0a0a0a] border border-[#ff1e1e]/30 text-[8px] text-white p-1 rounded font-mono z-50 whitespace-nowrap">
                      Hr {hr}:00 : {count} events {isOffHours && '⚠️ Off-Hours'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active V2 Timeline Spikes and Threats summary */}
          <div className="flex flex-col gap-1 justify-center text-[9px] text-[#8b8b8b]">
            <div className="flex items-center justify-between border-b border-[#111] pb-1">
              <span className="text-[8px] text-[#5b5b5b] font-bold uppercase tracking-wider flex items-center gap-1">
                <TrendingUp size={10} className="text-[#ff1e1e]" /> Chronological Threats
              </span>
              <span className="text-[#ff1e1e] font-bold">{spikes.length} Spikes Detected</span>
            </div>
            <div className="flex flex-col gap-0.5 mt-1 overflow-y-auto max-h-6">
              {spikes.slice(0, 2).map((s, idx) => (
                <div key={idx} className="flex justify-between items-center text-[8px]">
                  <span>⚡ SPIKE WINDOW ({s.count} events)</span>
                  <span className="text-[#ff1e1e] font-semibold">SEV: {s.severity}</span>
                </div>
              ))}
              {escalations.slice(0, 1).map((esc, idx) => (
                <div key={idx} className="flex justify-between items-center text-[8px] text-orange-400">
                  <span>📈 ESCALATION: {esc.entityName.toUpperCase()}</span>
                  <span>CRITICAL SHIFT</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-[130px] top-0 bottom-0 w-px bg-[#111111]" />

        {sorted.map((event, idx) => {
          const isActive = replayIndex === idx;
          const isPast = replayIndex > idx;
          const eventDate = new Date(event.timestamp);
          const dateStr = eventDate.toISOString().split('T')[0];
          const isOffHours = eventDate.getUTCHours() >= 22 || eventDate.getUTCHours() < 6;

          // Check if event is part of a spike
          const isSpikeEvent = spikes.some(s => s.events.includes(event.id));

          // Check if event is part of an escalation chain
          const activeEscalation = escalations.find(esc => esc.chain.includes(event.id));

          // Check if event is part of a correlated group
          const correlatedGroup = correlatedGroups.find(cg => cg.events.includes(event.id));

          // Check anomalies nearby (involving same entities and near same timestamp)
          const nearbyAnomalies = anomalies.filter(an => 
            an.affectedEntities.some(entId => event.entities?.includes(entId)) &&
            Math.abs(new Date(an.timestamp) - eventDate) <= 12 * 3600 * 1000
          );

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: replayIndex >= 0 ? (isPast || isActive ? 1 : 0.15) : 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className={`flex items-start gap-4 mb-4 relative ${isActive ? 'scale-[1.01]' : ''}`}
            >
              {/* Event Time Stamp block */}
              <div className="w-[115px] text-right flex-shrink-0 pt-1.5 pr-2">
                <div className="text-[10px] font-bold text-white">
                  {eventDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase()}
                </div>
                <div className="text-[9px] text-[#4b5563] font-mono mt-0.5">
                  {eventDate.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                {isOffHours && (
                  <span className="text-[7.5px] text-[#ff1e1e] bg-[#ff1e1e]/10 border border-[#ff1e1e]/30 px-1 rounded uppercase tracking-wider inline-block mt-1 font-semibold">
                    OFF-HOURS
                  </span>
                )}
              </div>

              {/* Central Marker Node */}
              <div className="relative z-10 flex-shrink-0 mt-2">
                {nearbyAnomalies.length > 0 ? (
                  // Red diamond for anomaly / threat marker
                  <div
                    className="w-3.5 h-3.5 rotate-45 border border-[#ff1e1e] bg-[#ff1e1e]/20 flex items-center justify-center cursor-help"
                    title={`${nearbyAnomalies.length} active behavioral anomalies detected`}
                    style={{ boxShadow: '0 0 8px rgba(255, 30, 30, 0.4)' }}
                  >
                    <div className="w-1 h-1 bg-[#ff1e1e] rounded-full" />
                  </div>
                ) : (
                  // Standard Dot
                  <div
                    className={`w-3 h-3 rounded-full border-2 ${isActive ? 'bg-[#ff1e1e] border-white scale-125' : 'bg-black'}`}
                    style={{
                      borderColor: severityColor(event.severity)
                    }}
                  />
                )}
              </div>

              {/* Event Panel Card */}
              <div className={`flex-1 p-3.5 rounded border transition-all ${
                isActive
                  ? 'bg-[#0a0a0a] border-[#ff1e1e] shadow-lg shadow-[#ff1e1e]/5'
                  : 'bg-[#050505] border-[#111111] hover:border-[#1a1a1a]'
              }`}>
                {/* Header info */}
                <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white uppercase">{event.title}</span>
                    <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border`}
                      style={{ 
                        color: severityColor(event.severity), 
                        background: `${severityColor(event.severity)}12`, 
                        borderColor: `${severityColor(event.severity)}30` 
                      }}
                    >
                      {event.severity}
                    </span>
                    <span className="text-[8px] text-[#4b5563] uppercase tracking-wider">{event.category}</span>
                  </div>

                  {/* V2 Tactical markers */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isSpikeEvent && (
                      <span className="text-[7.5px] bg-[#ff1e1e]/15 text-[#ff1e1e] border border-[#ff1e1e]/30 px-1 py-0.5 rounded font-bold uppercase tracking-widest animate-pulse">
                        SPIKE CELL
                      </span>
                    )}
                    {activeEscalation && (
                      <span className="text-[7.5px] bg-orange-500/10 text-orange-400 border border-orange-500/30 px-1 py-0.5 rounded font-bold uppercase tracking-widest">
                        ESCALATION
                      </span>
                    )}
                    {correlatedGroup && (
                      <span className="text-[7.5px] bg-blue-500/10 text-blue-400 border border-blue-500/30 px-1 py-0.5 rounded font-bold uppercase tracking-widest flex items-center gap-0.5">
                        <Users size={8} /> CORRELATED
                      </span>
                    )}
                  </div>
                </div>

                {/* Event Description */}
                <p className="text-[11px] text-[#8b8b8b] leading-relaxed mb-3 font-sans font-normal">{event.description}</p>

                {/* Sub-analytics breakdown */}
                {nearbyAnomalies.length > 0 && (
                  <div className="bg-[#0a0202] border border-[#ff1e1e]/15 p-2 rounded mb-2 text-[9px]">
                    <div className="text-[#ff1e1e] font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
                      <ShieldAlert size={10} /> Active Telemetry Anomaly Detected
                    </div>
                    {nearbyAnomalies.map((an, aIdx) => (
                      <div key={aIdx} className="text-[#b5b5b5] mt-0.5">
                        • <span className="font-semibold text-white uppercase">{an.title}:</span> {an.explanation}
                      </div>
                    ))}
                  </div>
                )}

                {activeEscalation && (
                  <div className="bg-orange-500/5 border border-orange-500/10 p-2 rounded mb-2 text-[9px]">
                    <div className="text-orange-400 font-bold uppercase tracking-wider flex items-center gap-1 mb-0.5">
                      <TrendingUp size={10} /> Risk Progression Chain
                    </div>
                    <span className="text-[#a5a5a5]">Progression trace: {activeEscalation.progression} (Severity Escalation)</span>
                  </div>
                )}

                {/* Involves Entities list */}
                {event.entities?.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap border-t border-[#111111] pt-2">
                    <span className="text-[8px] text-[#4b5563] uppercase mr-1">LINKED:</span>
                    {event.entities.map(eId => {
                      const ent = entities.find(e => e.id === eId);
                      return ent ? (
                        <button
                          key={eId}
                          onClick={() => setSelectedEntity(ent)}
                          className="text-[9px] font-mono px-2 py-0.5 rounded border transition-all hover:brightness-125 font-medium"
                          style={{ 
                            color: ENTITY_COLORS[ent.type], 
                            background: `${ENTITY_COLORS[ent.type]}0c`, 
                            borderColor: `${ENTITY_COLORS[ent.type]}20` 
                          }}
                        >
                          {ent.name}
                        </button>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
