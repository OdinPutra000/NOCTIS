import { motion } from 'framer-motion';
import useStore from '../../store/investigationStore';

export default function InvestigationHistory() {
  const { investigationHistory } = useStore();

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[#9ca3af] font-bold uppercase tracking-widest">Audit Trail</span>
      </div>

      <div className="flex flex-col gap-0 relative">
        {/* Vertical Line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#222]" />

        {investigationHistory.length > 0 ? investigationHistory.map((item, i) => (
          <div key={i} className="flex gap-3 relative pb-4 last:pb-0">
            <div className="w-[15px] h-[15px] rounded-full bg-[#111] border border-[#333] flex items-center justify-center z-10 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#0066ff]" />
            </div>
            
            <div className="flex flex-col gap-0.5 pt-0.5">
              <span className="text-[9px] font-mono text-[#6b7280]">
                {new Date(item.timestamp).toLocaleTimeString([], { hour12: false })}
              </span>
              <span className="text-[10px] text-white font-medium">{item.action}</span>
              {item.details && item.details !== item.action && (
                <span className="text-[9px] text-[#888] font-mono truncate max-w-[200px]">
                  {item.details}
                </span>
              )}
            </div>
          </div>
        )) : (
          <div className="text-[10px] text-[#555] font-mono py-4 text-center">
            NO ACTIONS RECORDED
          </div>
        )}
      </div>
    </div>
  );
}
