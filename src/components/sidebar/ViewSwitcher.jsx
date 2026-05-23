import { motion } from 'framer-motion';
import useStore from '../../store/investigationStore';
import { VIEW_MODES } from '../../data/sampleCase';

export default function ViewSwitcher() {
  const { activeView, setActiveView } = useStore();

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-noctis-purple" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-noctis-text-muted">View Mode</span>
      </div>

      <div className="grid grid-cols-3 gap-1">
        {VIEW_MODES.map(mode => (
          <motion.button
            key={mode.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveView(mode.id)}
            className={`py-2 px-1 rounded text-center transition-all text-[10px] font-medium ${
              activeView === mode.id
                ? 'bg-noctis-accent/15 text-noctis-accent border border-noctis-accent/30'
                : 'bg-noctis-surface/30 text-noctis-text-muted border border-transparent hover:border-noctis-border hover:text-noctis-text'
            }`}
          >
            <div className="text-sm mb-0.5">{mode.icon}</div>
            <div className="uppercase tracking-wider">{mode.label}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
