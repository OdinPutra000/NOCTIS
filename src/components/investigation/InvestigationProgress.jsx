import { motion } from 'framer-motion';
import useStore from '../../store/investigationStore';
import { computeInvestigationProgress } from '../../engine/investigationEngine';

export default function InvestigationProgress() {
  const { investigationSteps } = useStore();
  const progress = computeInvestigationProgress(investigationSteps);

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Color transition based on progress
  const getColor = (p) => {
    if (p >= 100) return '#22c55e'; // Success green
    if (p >= 50) return '#00bcd4';  // Cyan
    return '#0066ff';               // Blue
  };

  const color = getColor(progress);

  return (
    <div className="relative w-[120px] h-[120px] flex items-center justify-center">
      {/* Background Track */}
      <svg className="absolute inset-0 w-full h-full transform -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#111"
          strokeWidth="6"
        />
        {/* Animated Progress Ring */}
        <motion.circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>

      {/* Center Text */}
      <div className="flex flex-col items-center justify-center">
        <motion.span 
          key={progress}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-2xl font-mono font-bold text-white"
          style={{ color }}
        >
          {progress}%
        </motion.span>
        <span className="text-[8px] uppercase tracking-widest text-[#6b7280] font-mono mt-1">COMPLETE</span>
      </div>
    </div>
  );
}
