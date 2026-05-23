import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useStore from '../../store/investigationStore';

export default function TopNavbar() {
  const { activeCase, toggleNQL, anomalies = [] } = useStore();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (d) => d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatDate = (d) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });

  const hasCriticalAnomaly = anomalies.some(a => a.severity === 'CRITICAL');
  const notificationsCount = anomalies.length;

  return (
    <motion.nav
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="h-[50px] bg-noctis-panel border-b border-noctis-border flex items-center justify-between px-4 select-none z-50"
    >
      {/* LEFT: Logo + Mode */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-noctis-accent/10 border border-noctis-accent/30 flex items-center justify-center">
            <span className="text-noctis-accent font-bold text-xs">N</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-noctis-text-bright text-sm tracking-wider">NOCTIS</span>
            <span className="text-[8px] font-bold font-mono bg-[#ff1e1e]/15 border border-[#ff1e1e]/30 text-[#ff1e1e] px-1 rounded select-none">V2</span>
          </div>
          
          {hasCriticalAnomaly && (
            <div className="flex items-center gap-1 ml-1.5 bg-[#ff1e1e]/10 border border-[#ff1e1e]/35 px-1.5 py-0.5 rounded animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff1e1e]" />
              <span className="text-[7px] text-[#ff1e1e] font-bold uppercase tracking-widest font-mono">THREAT BEACON</span>
            </div>
          )}
        </div>
        <div className="h-4 w-px bg-noctis-border mx-1" />
        <span className="text-[10px] text-noctis-text-muted font-mono uppercase tracking-widest">
          {activeCase ? 'Behavioral Mode' : 'Standby'}
        </span>
      </div>

      {/* CENTER: Case Info */}
      <div className="flex items-center gap-3">
        {activeCase ? (
          <>
            <span className="text-sm text-noctis-text-bright font-medium">{activeCase.name}</span>
            <span className="font-mono text-[10px] bg-noctis-accent/10 text-noctis-accent border border-noctis-accent/20 px-2 py-0.5 rounded">
              {activeCase.id}
            </span>
            <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${
              activeCase.status === 'ACTIVE' ? 'bg-noctis-success/10 text-noctis-success border border-noctis-success/20' :
              'bg-noctis-warning/10 text-noctis-warning border border-noctis-warning/20'
            }`}>
              {activeCase.status}
            </span>
          </>
        ) : (
          <span className="text-xs text-noctis-text-muted font-mono">No active investigation</span>
        )}
      </div>

      {/* RIGHT: Controls */}
      <div className="flex items-center gap-3">
        {/* NEX shortcut */}
        <button
          onClick={toggleNQL}
          className="flex items-center gap-2 text-xs font-mono text-white bg-noctis-accent hover:bg-[#ff3b3b] transition-all px-4 py-1.5 rounded"
          style={{ boxShadow: '0 0 12px #ff1e1e55' }}
        >
          <span className="font-bold tracking-wider">NEX</span>
          <span className="opacity-80">&gt;_</span>
        </button>

        <div className="h-4 w-px bg-noctis-border" />

        {/* Analyst */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-noctis-purple/15 border border-noctis-purple/30 flex items-center justify-center">
            <span className="text-noctis-purple text-[10px] font-bold">K</span>
          </div>
          <span className="text-xs text-noctis-text-muted hidden xl:block font-mono">Agent Keval</span>
        </div>

        <div className="h-4 w-px bg-noctis-border" />

        {/* Clock */}
        <div className="text-right">
          <div className="font-mono text-xs text-noctis-text-bright">{formatTime(time)}</div>
          <div className="font-mono text-[9px] text-noctis-text-muted">{formatDate(time)}</div>
        </div>

        {/* Notifications */}
        <button className="relative p-1.5 hover:bg-noctis-surface rounded transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-noctis-text-muted">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {notificationsCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-noctis-danger rounded-full text-[8px] text-white flex items-center justify-center font-bold font-mono">
              {notificationsCount}
            </span>
          )}
        </button>

        {/* Settings */}
        <button className="p-1.5 hover:bg-noctis-surface rounded transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-noctis-text-muted">
            <circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </button>
      </div>
    </motion.nav>
  );
}
