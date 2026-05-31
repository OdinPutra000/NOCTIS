import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/investigationStore';
import { computeInvestigationProgress } from '../../engine/investigationEngine';
import CaseScorecard from './CaseScorecard';
import AIInvestigationOfficer from './AIInvestigationOfficer';
import InvestigationProgress from './InvestigationProgress';
import InvestigationHistory from './InvestigationHistory';
import StepDataIngestion from './steps/StepDataIngestion';
import StepEntityExtraction from './steps/StepEntityExtraction';
import StepRelationshipMapping from './steps/StepRelationshipMapping';
import StepBehavioralAnalysis from './steps/StepBehavioralAnalysis';
import StepAnomalyDetection from './steps/StepAnomalyDetection';
import StepPatternDetection from './steps/StepPatternDetection';
import StepAIReasoning from './steps/StepAIReasoning';
import StepRecommendedActions from './steps/StepRecommendedActions';

const PIPELINE_STEPS = [
  { id: 0, name: 'Data Ingestion', icon: '📥', short: 'INGEST' },
  { id: 1, name: 'Entity Extraction', icon: '🔍', short: 'EXTRACT' },
  { id: 2, name: 'Relationship Mapping', icon: '🔗', short: 'MAP' },
  { id: 3, name: 'Behavioral Analysis', icon: '🧠', short: 'BEHAVIOR' },
  { id: 4, name: 'Anomaly Detection', icon: '⚠️', short: 'ANOMALY' },
  { id: 5, name: 'Pattern Detection', icon: '📊', short: 'PATTERN' },
  { id: 6, name: 'AI Reasoning', icon: '🤖', short: 'REASON' },
  { id: 7, name: 'Recommendations', icon: '🎯', short: 'ACTION' },
];

const STEP_COMPONENTS = [
  StepDataIngestion,
  StepEntityExtraction,
  StepRelationshipMapping,
  StepBehavioralAnalysis,
  StepAnomalyDetection,
  StepPatternDetection,
  StepAIReasoning,
  StepRecommendedActions,
];

export default function InvestigationMode() {
  const {
    investigationModeOpen,
    closeInvestigationMode,
    investigationPhase,
    setInvestigationPhase,
    advanceInvestigationPhase,
    resetInvestigation,
    investigationSteps,
    activeCase,
    analysisComplete,
    generateInvestigationSummary,
  } = useStore();

  // Generate summary when mode opens and analysis is complete
  useEffect(() => {
    if (investigationModeOpen && analysisComplete) {
      generateInvestigationSummary();
    }
  }, [investigationModeOpen, analysisComplete]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (!investigationModeOpen) return;
      if (e.key === 'Escape') closeInvestigationMode();
      if (e.key === 'ArrowRight' && investigationPhase < 7) advanceInvestigationPhase();
      if (e.key === 'ArrowLeft' && investigationPhase > 0) setInvestigationPhase(investigationPhase - 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [investigationModeOpen, investigationPhase]);

  const progress = useMemo(() => computeInvestigationProgress(investigationSteps), [investigationSteps]);
  const ActiveStepComponent = STEP_COMPONENTS[investigationPhase] || StepDataIngestion;

  // Right panel tab state
  const [rightTab, setRightTab] = useState('scorecard');

  return (
    <AnimatePresence>
      {investigationModeOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[90] backdrop-blur-sm"
            onClick={closeInvestigationMode}
          />

          {/* Main Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full bg-[#000000] z-[91] flex flex-col overflow-hidden"
          >
            {/* === HEADER === */}
            <div className="h-[50px] bg-[#0a0a0a] border-b border-[#1a1a1a] flex items-center justify-between px-5 select-none flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#0066ff] animate-pulse" />
                  <span className="text-[11px] font-bold text-white uppercase tracking-widest">Investigation Mode</span>
                </div>
                <div className="h-4 w-px bg-[#222]" />
                {activeCase ? (
                  <>
                    <span className="text-[11px] text-[#e5e5e5] font-medium">{activeCase.name}</span>
                    <span className="font-mono text-[9px] bg-[#0066ff]/10 text-[#0066ff] border border-[#0066ff]/20 px-1.5 py-0.5 rounded">
                      {activeCase.id}
                    </span>
                  </>
                ) : (
                  <span className="text-[10px] text-[#6b7280] font-mono">No active case</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Pipeline Progress Mini */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-[#6b7280] font-mono uppercase tracking-wider">Pipeline</span>
                  <div className="flex items-center gap-0.5">
                    {PIPELINE_STEPS.map((step) => (
                      <div
                        key={step.id}
                        className={`w-2 h-2 rounded-full transition-all ${
                          step.id < investigationPhase ? 'bg-[#22c55e]' :
                          step.id === investigationPhase ? 'bg-[#0066ff] ring-2 ring-[#0066ff]/30' :
                          'bg-[#333]'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[9px] font-mono text-[#0066ff]">{progress}%</span>
                </div>

                <div className="h-4 w-px bg-[#222]" />

                <button
                  onClick={resetInvestigation}
                  className="text-[9px] font-mono text-[#6b7280] hover:text-white uppercase tracking-wider px-2 py-1 hover:bg-[#111] rounded transition-all"
                >
                  Reset
                </button>
                <button
                  onClick={closeInvestigationMode}
                  className="text-[#6b7280] hover:text-white p-1 hover:bg-[#111] rounded transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* === MAIN CONTENT === */}
            <div className="flex-1 flex overflow-hidden">
              {/* LEFT: Pipeline Steps Nav */}
              <div className="w-[220px] min-w-[220px] bg-[#050505] border-r border-[#1a1a1a] flex flex-col overflow-hidden">
                {/* Progress Ring */}
                <div className="p-4 border-b border-[#1a1a1a] flex justify-center">
                  <InvestigationProgress />
                </div>

                {/* Steps List */}
                <div className="flex-1 overflow-y-auto py-2">
                  {PIPELINE_STEPS.map((step) => {
                    const isActive = step.id === investigationPhase;
                    const isComplete = step.id < investigationPhase;
                    const isPending = step.id > investigationPhase;

                    return (
                      <button
                        key={step.id}
                        onClick={() => setInvestigationPhase(step.id)}
                        className={`w-full text-left px-4 py-2.5 flex items-center gap-2.5 transition-all relative group ${
                          isActive ? 'bg-[#0066ff]/8' :
                          'hover:bg-[#0a0a0a]'
                        }`}
                      >
                        {/* Active indicator */}
                        {isActive && (
                          <motion.div
                            layoutId="activeStep"
                            className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#0066ff]"
                          />
                        )}

                        {/* Step number/status */}
                        <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold font-mono flex-shrink-0 ${
                          isComplete ? 'bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30' :
                          isActive ? 'bg-[#0066ff]/15 text-[#0066ff] border border-[#0066ff]/30' :
                          'bg-[#111] text-[#555] border border-[#222]'
                        }`}>
                          {isComplete ? '✓' : step.id + 1}
                        </div>

                        {/* Step info */}
                        <div className="flex-1 min-w-0">
                          <div className={`text-[10px] font-medium truncate ${
                            isActive ? 'text-white' :
                            isComplete ? 'text-[#22c55e]' :
                            'text-[#6b7280]'
                          }`}>
                            {step.name}
                          </div>
                          <div className={`text-[8px] font-mono uppercase tracking-widest ${
                            isActive ? 'text-[#0066ff]' :
                            isComplete ? 'text-[#22c55e]/60' :
                            'text-[#333]'
                          }`}>
                            {isComplete ? 'COMPLETE' : isActive ? 'ACTIVE' : 'PENDING'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Navigation Buttons */}
                <div className="p-3 border-t border-[#1a1a1a] flex gap-2">
                  <button
                    onClick={() => investigationPhase > 0 && setInvestigationPhase(investigationPhase - 1)}
                    disabled={investigationPhase === 0}
                    className="flex-1 py-1.5 text-[9px] font-mono uppercase tracking-wider border border-[#222] rounded hover:bg-[#111] transition-all disabled:opacity-30 disabled:cursor-not-allowed text-[#9ca3af]"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={advanceInvestigationPhase}
                    disabled={investigationPhase === 7}
                    className="flex-1 py-1.5 text-[9px] font-mono uppercase tracking-wider bg-[#0066ff]/10 text-[#0066ff] border border-[#0066ff]/20 rounded hover:bg-[#0066ff]/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              </div>

              {/* CENTER: Active Step Content */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Step Header */}
                <div className="h-[44px] bg-[#080808] border-b border-[#1a1a1a] flex items-center justify-between px-5 flex-shrink-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm">{PIPELINE_STEPS[investigationPhase]?.icon}</span>
                    <span className="text-[11px] font-semibold text-white">
                      Step {investigationPhase + 1}: {PIPELINE_STEPS[investigationPhase]?.name}
                    </span>
                    <span className="text-[8px] font-mono bg-[#0066ff]/10 text-[#0066ff] border border-[#0066ff]/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {investigationPhase < 7 ? 'In Progress' : 'Final Step'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-mono text-[#555] uppercase tracking-wider">
                      ← → Navigate • ESC Close
                    </span>
                  </div>
                </div>

                {/* Step Content */}
                <div className="flex-1 overflow-y-auto">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={investigationPhase}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.2 }}
                      className="h-full"
                    >
                      <ActiveStepComponent />
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* AI Investigation Officer — bottom strip */}
                <div className="h-[180px] min-h-[180px] border-t border-[#1a1a1a] flex-shrink-0">
                  <AIInvestigationOfficer />
                </div>
              </div>

              {/* RIGHT: Scorecard & History */}
              <div className="w-[280px] min-w-[280px] bg-[#050505] border-l border-[#1a1a1a] flex flex-col overflow-hidden">
                {/* Right Panel Tabs */}
                <div className="flex border-b border-[#1a1a1a]">
                  {[
                    { id: 'scorecard', label: 'Scorecard' },
                    { id: 'history', label: 'History' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setRightTab(tab.id)}
                      className={`flex-1 py-2.5 text-[9px] uppercase tracking-widest font-mono font-medium transition-all relative ${
                        rightTab === tab.id ? 'text-[#0066ff]' : 'text-[#555] hover:text-[#999]'
                      }`}
                    >
                      {tab.label}
                      {rightTab === tab.id && (
                        <motion.div
                          layoutId="investigationRightTab"
                          className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#0066ff]"
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* Right Panel Content */}
                <div className="flex-1 overflow-y-auto">
                  {rightTab === 'scorecard' && <CaseScorecard />}
                  {rightTab === 'history' && <InvestigationHistory />}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
