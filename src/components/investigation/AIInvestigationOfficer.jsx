import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import useStore from '../../store/investigationStore';

export default function AIInvestigationOfficer() {
  const { investigationOfficerMessages } = useStore();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [investigationOfficerMessages]);

  return (
    <div className="h-full w-full bg-[#030303] flex flex-col overflow-hidden relative">
      {/* Header */}
      <div className="h-8 bg-[#080808] border-b border-[#1a1a1a] flex items-center px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#0066ff] animate-pulse" />
          <span className="text-[10px] text-white font-bold uppercase tracking-widest">AI Investigation Officer</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {investigationOfficerMessages.length > 0 ? investigationOfficerMessages.map((msg, i) => (
          <motion.div
            key={msg.id || i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-1"
          >
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-[#555]">
                [{new Date(msg.timestamp).toLocaleTimeString([], { hour12: false })}]
              </span>
              <span className="text-[9px] font-mono text-[#0066ff] uppercase">SYSTEM</span>
              {msg.stepTitle && (
                <span className="text-[9px] font-mono text-[#888] bg-[#111] px-1 rounded">
                  {msg.stepTitle}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#d1d5db] font-mono leading-relaxed pl-[65px]">
              {msg.content}
            </p>
          </motion.div>
        )) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-[10px] text-[#555] font-mono">AWAITING INVESTIGATION DATA</span>
          </div>
        )}
      </div>
      
      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-10 opacity-20" />
    </div>
  );
}
