import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import useStore from '../../store/investigationStore';
import { generateAIInsights } from '../../engine/aiReasoning';

export default function PatternAnalysis() {
  const { entities, relationships, events, patterns: storedPatterns } = useStore();
  const [patterns, setPatterns] = useState([]);
  const [centralEntities, setCentralEntities] = useState([]);
  const [commData, setCommData] = useState({ spikes: 0, density: 0 });

  useEffect(() => {
    if (entities.length === 0) return;
    const insights = generateAIInsights(entities, relationships, events);
    setPatterns(insights.patterns || []);
    setCentralEntities(insights.centralEntities || []);
    
    const commRels = relationships.filter(r => r.type === 'communicated');
    const suspRels = relationships.filter(r => r.suspicious);
    setCommData({
      spikes: commRels.length,
      density: relationships.length > 0 ? Math.round((suspRels.length / relationships.length) * 100) : 0,
    });
  }, [entities, relationships, events]);

  if (entities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <span className="text-xs text-noctis-text-muted">No pattern data available</span>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-4">
      {/* Anomalies */}
      <div>
        <div className="text-[10px] uppercase tracking-widest text-noctis-text-muted font-semibold mb-2">Detected Anomalies</div>
        <div className="space-y-2">
          {patterns.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-2.5 rounded border border-noctis-border bg-noctis-surface/20"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-noctis-text-bright">{p.type}</span>
                <span className={`severity-${p.severity}`}>{p.severity.toUpperCase()}</span>
              </div>
              <p className="text-[10px] text-noctis-text-muted leading-relaxed">{p.description}</p>
            </motion.div>
          ))}
          {patterns.length === 0 && (
            <p className="text-[10px] text-noctis-text-muted font-mono">No anomalies detected.</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded border border-noctis-border bg-noctis-surface/20 text-center">
          <div className="text-lg font-bold text-noctis-warning font-mono">{commData.spikes}</div>
          <div className="text-[9px] uppercase tracking-wider text-noctis-text-muted">Comm. Links</div>
        </div>
        <div className="p-2.5 rounded border border-noctis-border bg-noctis-surface/20 text-center">
          <div className="text-lg font-bold text-noctis-danger font-mono">{commData.density}%</div>
          <div className="text-[9px] uppercase tracking-wider text-noctis-text-muted">Suspicious Ratio</div>
        </div>
      </div>

      {/* Central Entities */}
      <div>
        <div className="text-[10px] uppercase tracking-widest text-noctis-text-muted font-semibold mb-2">Central Entities</div>
        <div className="space-y-1.5">
          {centralEntities.map((e, i) => (
            <div key={e.id} className="flex items-center gap-2 p-2 rounded border border-noctis-border/50 bg-noctis-surface/10">
              <span className="text-[10px] font-mono text-noctis-text-muted w-4">#{i + 1}</span>
              <span className="text-[11px] text-noctis-text-bright flex-1 truncate">{e.name}</span>
              <span className="text-[9px] font-mono text-noctis-text-muted">C:{e.centrality}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
