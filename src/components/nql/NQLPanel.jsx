import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/investigationStore';
import { parseNQL } from '../../engine/nqlParser';

export default function NQLPanel() {
  const { nqlOpen, toggleNQL, nqlHistory, addNQLHistory, entities, relationships, events, anomalies, behaviorProfiles, clusters, operationalPatterns, timelineIntelligence, setSelectedEntity, openInvestigationMode } = useStore();
  const [input, setInput] = useState('');
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (nqlOpen && inputRef.current) inputRef.current.focus();
  }, [nqlOpen]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggleNQL();
      }
      if (e.key === 'Escape' && nqlOpen) toggleNQL();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [nqlOpen, toggleNQL]);

  const execute = () => {
    if (!input.trim()) return;
    const v2Context = {
      anomalies,
      behaviorProfiles,
      clusters,
      operationalPatterns,
      timelineIntelligence
    };
    const result = parseNQL(input, entities, relationships, events, v2Context);
    const newEntry = { command: input, result, timestamp: new Date().toISOString() };
    addNQLHistory(newEntry);
    setResults(prev => [...prev, newEntry]); // Append to end

    if (result.type === 'trace' && result.data?.root) {
      setSelectedEntity(result.data.root);
    }

    if (result.type === 'investigation_command') {
      setTimeout(() => {
        toggleNQL(); // Close terminal
        openInvestigationMode(); // Open investigation mode
      }, 500);
    }

    setInput('');
  };

  const highlightCommand = (cmd) => {
    const commands = ['SHOW', 'MATCH', 'TRACE', 'SCAN', 'ANALYZE', 'DETECT', 'GENERATE', 'EXPORT', 'PREDICT'];
    const keywords = ['WHERE', 'RETURN', 'ORDER BY', 'LIMIT', 'DEPTH', 'BEHAVIOR', 'ESCALATION_CHAIN', 'ANOMALIES', 'SUSPICIOUS_CLUSTERS', 'OPERATIONAL_PATTERNS'];
    
    let highlighted = cmd;
    
    // Simple regex replacements for syntax highlighting
    commands.forEach(c => {
      highlighted = highlighted.replace(new RegExp(`\\b${c}\\b`, 'gi'), `<span style="color: #00a5ff">$&</span>`);
    });
    keywords.forEach(k => {
      highlighted = highlighted.replace(new RegExp(`\\b${k}\\b`, 'gi'), `<span style="color: #ff3b3b">$&</span>`);
    });
    // Strings
    highlighted = highlighted.replace(/(["'])(.*?)\1/g, '<span style="color: #a3e635">$&</span>');
    // Numbers
    highlighted = highlighted.replace(/\b(\d+)\b/g, '<span style="color: #f59e0b">$&</span>');
    // Comments
    highlighted = highlighted.replace(/(\/\/.*)$/g, '<span style="color: #6b7280">$&</span>');

    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  const renderResult = (r) => {
    switch (r.type) {
      case 'help':
      case 'summary':
        return <pre className="text-xs font-mono text-[#e5e5e5] whitespace-pre-wrap">{r.data}</pre>;
      case 'trace':
        return (
          <div>
            <div className="text-xs text-[#22c55e] mb-1">{r.data.message}</div>
            <div className="space-y-0.5">
              {r.data.nodes.map(n => (
                <div key={n.id} className="text-xs font-mono text-[#e5e5e5]">
                  → {n.name} ({n.type}) Risk: {n.risk}
                </div>
              ))}
            </div>
          </div>
        );
      case 'list':
        return (
          <div>
            <div className="text-xs text-[#22c55e] mb-1">{r.data.message}</div>
            <div className="space-y-0.5">
              {r.data.items.map(item => (
                <div key={item.id} className="text-xs font-mono text-[#e5e5e5]">
                  → {item.name} ({item.type}) Risk: {item.risk}
                </div>
              ))}
            </div>
          </div>
        );
      case 'scan':
        return (
          <div>
            {r.data.items.map((item, i) => (
              <div key={i} className={`text-xs font-mono ${
                item.startsWith('CRITICAL') ? 'text-[#ef4444]' :
                item.startsWith('WARNING') ? 'text-[#f59e0b]' : 'text-[#e5e5e5]'
              }`}>{item}</div>
            ))}
          </div>
        );
      case 'anomalies_list':
        return (
          <div className="space-y-2 border border-[#222222]/40 p-3 bg-[#020202] max-w-2xl">
            <div className="text-[10px] uppercase font-bold tracking-widest text-[#ff1e1e] border-b border-[#222222]/20 pb-1 mb-2">
              {r.data.title} ({r.data.items.length})
            </div>
            {r.data.items.length === 0 ? (
              <div className="text-[#555] text-xs">No active anomalies detected.</div>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {r.data.items.map((anom, i) => (
                  <div key={i} className="border-l-2 border-[#ff1e1e] pl-2 py-1 bg-black/30 text-xs font-mono">
                    <div className="flex justify-between items-center text-[10px] mb-0.5">
                      <span className="text-[#ff1e1e] font-bold">[{anom.severity}] CONFIDENCE: {anom.confidence}%</span>
                      <span className="text-[#555]">{new Date(anom.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-[#e5e5e5] font-semibold">{anom.title}</div>
                    <div className="text-[#888] text-[10px] mt-1 leading-relaxed">{anom.explanation}</div>
                    {anom.affectedEntities?.length > 0 && (
                      <div className="text-[9px] text-[#00bcd4] mt-1">
                        AFFECTED: {anom.affectedEntities.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'behavior_profile': {
        const { entity, profile } = r.data;
        return (
          <div className="border border-[#222222] p-3 bg-[#020202] text-xs font-mono space-y-2 max-w-2xl">
            <div className="flex justify-between items-center border-b border-[#222222] pb-1">
              <span className="font-bold text-white">{entity.name} BEHAVIOR PROFILE</span>
              <span className="font-mono text-[10px] text-gray-500">ID: {entity.id}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] text-gray-500 uppercase">Suspicious Behavior Score</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-[#ff1e1e]">{profile.behaviorScore}</span>
                  <span className="text-xs text-gray-600">/100</span>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                    profile.trend === 'ESCALATING' ? 'bg-[#ff1e1e]/10 text-[#ff1e1e]' : 'bg-gray-500/10 text-gray-400'
                  }`}>
                    {profile.trend}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase font-mono">Behavioral Flags</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.behaviorFlags?.length === 0 ? (
                    <span className="text-gray-600 text-[10px]">NONE</span>
                  ) : (
                    profile.behaviorFlags.map(f => (
                      <span key={f} className="text-[8px] bg-[#ff1e1e]/10 text-[#ff1e1e] border border-[#ff1e1e]/20 px-1 rounded font-mono">
                        {f}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            <div className="border-t border-[#1a1a1a] pt-2">
              <div className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1.5">Dimensions Breakdown</div>
              <div className="space-y-1">
                {Object.entries(profile.dimensions || {}).map(([dim, val]) => (
                  <div key={dim} className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 capitalize">{dim.replace(/([A-Z])/g, ' $1')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1 bg-[#111] rounded overflow-hidden">
                        <div className="h-full bg-[#ff1e1e]" style={{ width: `${val}%` }} />
                      </div>
                      <span className="text-[10px] text-[#e5e5e5] w-6 text-right">{val}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-[#1a1a1a] pt-2">
              <div className="text-[10px] text-[#ff1e1e] font-semibold">QUALITATIVE ASSESSMENT</div>
              <div className="text-gray-400 text-[10px] leading-relaxed mt-0.5">{profile.assessment}</div>
            </div>
          </div>
        );
      }
      case 'clusters_list':
        return (
          <div className="space-y-2 border border-[#222222]/40 p-3 bg-[#020202] max-w-2xl">
            <div className="text-[10px] uppercase font-bold tracking-widest text-white border-b border-[#222222]/20 pb-1 mb-2">
              {r.data.title}
            </div>
            {r.data.clusters.length === 0 ? (
              <div className="text-gray-600 text-xs">No coordinated networks detected.</div>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {r.data.clusters.map((cluster, i) => (
                  <div key={i} className="p-2 border border-[#222222] bg-[#050505] text-xs font-mono">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white font-bold">{cluster.name}</span>
                      <span className={`text-[9px] font-semibold px-1.5 rounded ${
                        cluster.threatLevel === 'CRITICAL' || cluster.threatLevel === 'HIGH' ? 'bg-[#ff1e1e]/10 text-[#ff1e1e]' : 'bg-gray-500/10 text-gray-400'
                      }`}>{cluster.threatLevel} THREAT</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400 mt-1.5">
                      <div>CLASSIFICATION: <span className="text-white">{cluster.classification}</span></div>
                      <div>HUB COORDINATOR: <span className="text-white">{cluster.hub}</span></div>
                      <div>DENSITY: <span className="text-white">{Math.round(cluster.density * 100)}%</span></div>
                      <div>SUSPICIOUS LINKS: <span className="text-white">{Math.round(cluster.suspiciousLinkRatio * 100)}%</span></div>
                    </div>
                    <div className="text-[9px] text-gray-500 mt-1.5 truncate">
                      MEMBERS: {cluster.entities.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'patterns_list':
        return (
          <div className="space-y-2 border border-[#222222]/40 p-3 bg-[#020202] max-w-2xl">
            <div className="text-[10px] uppercase font-bold tracking-widest text-[#ff1e1e] border-b border-[#222222]/20 pb-1 mb-2">
              {r.data.title}
            </div>
            {r.data.patterns.length === 0 ? (
              <div className="text-gray-500 text-xs">No active structural patterns detected.</div>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {r.data.patterns.map((pat, i) => (
                  <div key={i} className="p-2 border border-[#222222] bg-[#050505] text-xs font-mono">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white font-bold">{pat.name}</span>
                      <span className={`text-[9px] font-semibold px-1 rounded ${
                        pat.severity === 'CRITICAL' || pat.severity === 'HIGH' ? 'bg-[#ff1e1e]/10 text-[#ff1e1e]' : 'bg-gray-500/10 text-gray-400'
                      }`}>{pat.severity}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 leading-relaxed">{pat.description}</div>
                    <div className="text-[9px] text-[#00bcd4] mt-1.5">
                      INVOLVED: {pat.involvedEntities.join(' ➔ ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'escalation_chain': {
        const { entity, escalations, riskHistory, riskTrend } = r.data;
        return (
          <div className="border border-[#222222] p-3 bg-[#020202] text-xs font-mono space-y-2 max-w-2xl">
            <div className="flex justify-between items-center border-b border-[#222222] pb-1">
              <span className="font-bold text-white">{entity.name} ESCALATION PROFILE</span>
              <span className={`text-[9px] font-semibold px-1.5 rounded ${
                riskTrend === 'ESCALATING' ? 'bg-[#ff1e1e]/10 text-[#ff1e1e]' : 'bg-gray-500/10 text-gray-400'
              }`}>TREND: {riskTrend}</span>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase mb-1">Risk Score Over Time (Analytics Steps)</div>
              <div className="flex items-center gap-1.5 mt-1">
                {riskHistory.map((risk, index) => (
                  <div key={index} className="flex items-center">
                    <div className="px-2 py-0.5 bg-[#111] border border-[#222222] text-[#e5e5e5] rounded text-[10px] font-mono">
                      {risk}
                    </div>
                    {index < riskHistory.length - 1 && <span className="text-gray-600 mx-1">➔</span>}
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-[#1a1a1a] pt-2">
              <div className="text-[10px] text-[#ff1e1e] font-semibold uppercase mb-1.5">Detected Escalation Chains</div>
              {escalations.length === 0 ? (
                <div className="text-gray-600 text-[10px]">No specific chronological severity escalations detected in the timeline.</div>
              ) : (
                <div className="space-y-1.5">
                  {escalations.map((esc, i) => (
                    <div key={i} className="p-2 border border-[#222222] bg-[#050505] text-[10px] space-y-1">
                      <div className="text-white font-semibold">{esc.progression}</div>
                      <div className="text-gray-500 text-[9px]">
                        SPAN: {new Date(esc.startTime).toLocaleDateString()} to {new Date(esc.endTime).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }
      case 'investigation_command':
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[#0066ff]">
              <div className="w-2 h-2 rounded-full bg-[#0066ff] animate-pulse" />
              <span className="font-bold uppercase tracking-widest">Investigation Mode</span>
            </div>
            <p className="text-[#a3e635] animate-pulse">{r.text}</p>
          </div>
        );
      case 'prediction':
        return (
          <div>
            <div className="text-xs text-[#00a5ff] mb-1">{r.data.message}</div>
            {r.data.predictions.map(p => (
              <div key={p.title} className="text-xs font-mono text-[#e5e5e5] flex items-center gap-2">
                <span>{p.title}</span>
                <span className="text-[#f59e0b]">{p.confidence}%</span>
              </div>
            ))}
          </div>
        );
      case 'info':
        return <div className="text-xs text-[#22c55e]">{r.data}</div>;
      case 'error':
        return <div className="text-xs text-[#ef4444]">{r.data}</div>;
      default:
        return <div className="text-xs text-[#e5e5e5]">{JSON.stringify(r.data)}</div>;
    }
  };

  return (
    <AnimatePresence>
      {nqlOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleNQL}
            className="fixed inset-0 bg-black/50 z-[100]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 h-[45vh] bg-[#000000] border-t border-[#222222] shadow-[0_-10px_40px_rgba(0,0,0,0.8)] z-[101] flex overflow-hidden font-mono"
          >
            {/* Left: Command History */}
            <div className="w-64 bg-[#050505] border-r border-[#222222] flex flex-col">
              <div className="p-2 border-b border-[#222222] text-[10px] uppercase text-[#6b7280] font-bold tracking-widest">
                Command History
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {results.map((r, i) => (
                  <div key={i} className="text-[10px] text-[#9ca3af] truncate cursor-pointer hover:text-white" onClick={() => setInput(r.command)}>
                    {r.command}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Main Terminal */}
            <div className="flex-1 flex flex-col relative">
              <div className="absolute top-2 right-4 text-[10px] text-[#6b7280]">
                NEX TERMINAL v2.0.4
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4" id="nex-terminal-output">
                {results.length === 0 && (
                  <div className="text-[#6b7280] text-xs">
                    Type HELP for commands. System ready.
                  </div>
                )}
                {results.map((r, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="text-[#ff1e1e] font-bold mt-0.5">NEX &gt;</span>
                      <span className="text-[#e5e5e5] text-xs leading-5">
                        {highlightCommand(r.command)}
                      </span>
                    </div>
                    <div className="pl-8 text-xs">
                      {renderResult(r.result)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-3 border-t border-[#222222] bg-[#0a0a0a] flex items-center gap-3">
                <span className="text-[#ff1e1e] font-bold text-sm">NEX &gt;</span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') execute(); }}
                  className="flex-1 bg-transparent text-[#e5e5e5] text-sm outline-none placeholder:text-[#333333]"
                  placeholder="Enter command..."
                  spellCheck="false"
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
