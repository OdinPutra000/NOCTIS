import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import useStore from '../../store/investigationStore';
import { generateAIInsights } from '../../engine/aiReasoning';

export default function AIInsights() {
  const { entities, relationships, events } = useStore();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (entities.length === 0) { setInsights(null); return; }
    setLoading(true);
    const timer = setTimeout(() => {
      const result = generateAIInsights(entities, relationships, events);
      setInsights(result);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [entities, relationships, events]);

  if (entities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <span className="text-xs text-noctis-text-muted">Load data to generate AI insights</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <div className="w-6 h-6 border-2 border-noctis-accent border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs text-noctis-text-muted font-mono">Generating AI insights...</span>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-4">
      {/* Summary */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-noctis-accent" />
          <span className="text-[10px] uppercase tracking-widest text-noctis-text-muted font-semibold">Operational Summary</span>
        </div>
        <div className="p-3 rounded border border-noctis-border bg-noctis-surface/20">
          <p className="text-[11px] text-noctis-text leading-relaxed">{insights.summary}</p>
        </div>
      </div>

      {/* Suspicious Entity Explanations */}
      {insights.suspiciousExplanations?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-noctis-danger" />
            <span className="text-[10px] uppercase tracking-widest text-noctis-text-muted font-semibold">Threat Explanations</span>
          </div>
          <div className="space-y-2">
            {insights.suspiciousExplanations.slice(0, 3).map((se, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-2.5 rounded border border-noctis-border/50 bg-noctis-surface/10"
              >
                <div className="text-[11px] font-medium text-noctis-text-bright mb-1">{se.entity.name}</div>
                <p className="text-[10px] text-noctis-text-muted leading-relaxed">{se.explanation}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Behavioral Observations */}
      {insights.behavioralObservations?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-noctis-warning" />
            <span className="text-[10px] uppercase tracking-widest text-noctis-text-muted font-semibold">Behavioral Analysis</span>
          </div>
          <div className="space-y-1.5">
            {insights.behavioralObservations.map((obs, i) => (
              <div key={i} className="flex gap-2 p-2 rounded border border-noctis-border/30 bg-noctis-surface/10">
                <span className="text-noctis-warning text-[10px] flex-shrink-0 mt-0.5">▸</span>
                <p className="text-[10px] text-noctis-text-muted leading-relaxed">{obs}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PREDICTIONS — "What may happen next?" */}
      {insights.predictions?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-noctis-purple animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest text-noctis-purple font-semibold">What May Happen Next?</span>
          </div>
          <div className="space-y-2">
            {insights.predictions.map((pred, i) => (
              <motion.div
                key={pred.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                className="p-3 rounded border border-noctis-border bg-noctis-surface/20"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-medium text-noctis-text-bright">{pred.title}</span>
                  <span className={`text-sm font-bold font-mono ${
                    pred.confidence >= 80 ? 'text-noctis-danger' :
                    pred.confidence >= 60 ? 'text-noctis-warning' : 'text-noctis-success'
                  }`}>
                    {pred.confidence}%
                  </span>
                </div>
                <p className="text-[10px] text-noctis-text-muted leading-relaxed mb-2">{pred.description}</p>
                <div className="confidence-bar">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pred.confidence}%` }}
                    transition={{ duration: 1.2, delay: i * 0.15 }}
                    className="confidence-bar-fill"
                    style={{
                      background: pred.confidence >= 80 ? '#f85149' :
                                  pred.confidence >= 60 ? '#e3b341' : '#3fb950'
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Assessment */}
      {insights.riskAssessment && (
        <div className="p-3 rounded border border-noctis-border bg-noctis-surface/20">
          <div className="text-[10px] uppercase tracking-widest text-noctis-text-muted font-semibold mb-2">Overall Risk Assessment</div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <div className="text-lg font-bold font-mono" style={{
                color: insights.riskAssessment.overallLevel === 'CRITICAL' ? '#ff4545' :
                       insights.riskAssessment.overallLevel === 'HIGH' ? '#f85149' :
                       insights.riskAssessment.overallLevel === 'MEDIUM' ? '#e3b341' : '#3fb950'
              }}>
                {insights.riskAssessment.overallLevel}
              </div>
              <div className="text-[9px] text-noctis-text-muted uppercase tracking-wider">Level</div>
            </div>
            <div>
              <div className="text-lg font-bold font-mono text-noctis-danger">{insights.riskAssessment.suspRatio}%</div>
              <div className="text-[9px] text-noctis-text-muted uppercase tracking-wider">Susp. Ratio</div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
