import useStore from '../../store/investigationStore';

export default function ActiveCases() {
  const { cases, activeCase } = useStore();

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-noctis-success" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-noctis-text-muted">Active Cases</span>
      </div>

      <div className="space-y-1 max-h-[140px] overflow-y-auto">
        {cases.length === 0 && !activeCase ? (
          <div className="text-[10px] text-noctis-text-muted font-mono py-2 text-center">
            No saved cases
          </div>
        ) : (
          <>
            {activeCase && (
              <div className="flex items-center gap-2 p-2 rounded bg-noctis-accent/8 border border-noctis-accent/20">
                <div className="w-1.5 h-1.5 rounded-full bg-noctis-accent animate-pulse" />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-noctis-text-bright truncate">{activeCase.name}</div>
                  <div className="text-[9px] text-noctis-text-muted font-mono">{activeCase.id}</div>
                </div>
              </div>
            )}
            {cases.filter(c => c.id !== activeCase?.id).map(c => (
              <div key={c.id} className="flex items-center gap-2 p-2 rounded hover:bg-noctis-surface/50 cursor-pointer transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-noctis-text-muted" />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-noctis-text truncate">{c.name}</div>
                  <div className="text-[9px] text-noctis-text-muted font-mono">{c.entityCount || 0} entities</div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
