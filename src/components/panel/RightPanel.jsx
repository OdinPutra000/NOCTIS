import { motion } from 'framer-motion';
import useStore from '../../store/investigationStore';
import EntityDetails from './EntityDetails';
import PatternAnalysis from './PatternAnalysis';
import AIInsights from './AIInsights';
import InvestigationRoadmap from './InvestigationRoadmap';
import BehaviorPanel from './BehaviorPanel';

import { User, Grid, Brain, Map, Activity } from 'lucide-react';

const TABS = [
  { id: 'details', label: 'Entity', icon: User },
  { id: 'behavior', label: 'Behavior', icon: Activity },
  { id: 'patterns', label: 'Patterns', icon: Grid },
  { id: 'insights', label: 'AI Insights', icon: Brain },
  { id: 'roadmap', label: 'Roadmap', icon: Map },
];

export default function RightPanel() {
  const { rightPanelTab, setRightPanelTab } = useStore();

  return (
    <motion.aside
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="w-[320px] min-w-[320px] bg-[#0a0a0a] border-l border-[#1a1a1a] flex flex-col overflow-hidden"
    >
      {/* Tabs */}
      <div className="flex border-b border-[#1a1a1a]">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setRightPanelTab(tab.id)}
              className={`flex-1 py-2.5 text-[9px] flex flex-col items-center justify-center gap-1 uppercase tracking-wider font-mono font-medium transition-all relative ${
                rightPanelTab === tab.id
                  ? 'text-[#ff1e1e]'
                  : 'text-[#6b7280] hover:text-[#d1d5db]'
              }`}
            >
              <Icon size={11} />
              <span>{tab.label}</span>
              {rightPanelTab === tab.id && (
                <motion.div
                  layoutId="rightPanelTab"
                  className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#ff1e1e]"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {rightPanelTab === 'details' && <EntityDetails />}
        {rightPanelTab === 'behavior' && <BehaviorPanel />}
        {rightPanelTab === 'patterns' && <PatternAnalysis />}
        {rightPanelTab === 'insights' && <AIInsights />}
        {rightPanelTab === 'roadmap' && <InvestigationRoadmap />}
      </div>
    </motion.aside>
  );
}
