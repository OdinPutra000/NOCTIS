import { motion } from 'framer-motion';
import useStore from '../../store/investigationStore';

export default function InvestigationRoadmap() {
  const { investigationSteps } = useStore();

  const stepIcons = {
    ingestion: '📥',
    mapping: '🗺️',
    relationships: '🔗',
    patterns: '🔍',
    behavioral: '🧠',
    reasoning: '🤖',
    recommendation: '📋',
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 rounded-full bg-noctis-success" />
        <span className="text-[10px] uppercase tracking-widest text-noctis-text-muted font-semibold">Investigation Roadmap</span>
      </div>

      <div className="space-y-2">
        {investigationSteps.map((step, i) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`p-3 rounded border transition-all ${
              step.status === 'complete' ? 'border-noctis-success/30 bg-noctis-success/5' :
              step.status === 'active' ? 'border-noctis-accent/40 bg-noctis-accent/5' :
              'border-noctis-border bg-noctis-surface/10'
            }`}
          >
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="text-sm">{stepIcons[step.id]}</span>
              <span className={`text-[11px] font-medium flex-1 ${
                step.status === 'complete' ? 'text-noctis-success' :
                step.status === 'active' ? 'text-noctis-accent' : 'text-noctis-text-muted'
              }`}>
                {step.name}
              </span>
              {step.status === 'complete' && <span className="text-noctis-success text-xs">✓</span>}
              {step.status === 'active' && (
                <div className="w-3 h-3 border-2 border-noctis-accent border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            
            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-noctis-border/50 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${step.progress}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full rounded-full ${
                  step.status === 'complete' ? 'bg-noctis-success' :
                  step.status === 'active' ? 'bg-noctis-accent' : 'bg-noctis-border'
                }`}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 p-3 rounded border border-noctis-border bg-noctis-surface/20">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-noctis-text-muted uppercase tracking-wider">Completion</span>
          <span className="text-sm font-bold font-mono text-noctis-accent">
            {Math.round(investigationSteps.filter(s => s.status === 'complete').length / investigationSteps.length * 100)}%
          </span>
        </div>
        <div className="w-full h-1 rounded-full bg-noctis-border mt-2 overflow-hidden">
          <div
            className="h-full rounded-full bg-noctis-accent transition-all"
            style={{ width: `${investigationSteps.filter(s => s.status === 'complete').length / investigationSteps.length * 100}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}
