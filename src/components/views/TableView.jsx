import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import useStore from '../../store/investigationStore';
import { ENTITY_COLORS } from '../../data/sampleCase';
import { getRiskLevel } from '../../engine/riskEngine';

export default function TableView() {
  const { entities, relationships, setSelectedEntity, selectedEntity } = useStore();
  const [sortKey, setSortKey] = useState('risk');
  const [sortDir, setSortDir] = useState('desc');
  const [search, setSearch] = useState('');

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const data = useMemo(() => {
    let result = entities.map(e => ({
      ...e,
      connections: relationships.filter(r => r.source === e.id || r.target === e.id).length,
      lastActivity: e.metadata?.lastActivity || '-',
    }));

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(e => e.name.toLowerCase().includes(q) || e.type.includes(q));
    }

    result.sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [entities, relationships, sortKey, sortDir, search]);

  if (entities.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-noctis-bg">
        <span className="font-mono text-sm text-noctis-text-muted">No entities. Load intelligence data.</span>
      </div>
    );
  }

  const columns = [
    { key: 'name', label: 'Name', width: 'flex-1' },
    { key: 'type', label: 'Type', width: 'w-28' },
    { key: 'risk', label: 'Risk Score', width: 'w-24' },
    { key: 'connections', label: 'Connections', width: 'w-24' },
    { key: 'status', label: 'Status', width: 'w-32' },
    { key: 'lastActivity', label: 'Last Activity', width: 'w-36' },
  ];

  return (
    <div className="w-full h-full bg-noctis-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-noctis-border">
        <div>
          <h2 className="text-sm font-semibold text-noctis-text-bright uppercase tracking-wider">Entity Register</h2>
          <p className="text-[10px] text-noctis-text-muted font-mono mt-0.5">{data.length} entities</p>
        </div>
        <input
          className="bg-noctis-surface border border-noctis-border rounded px-3 py-1.5 text-xs text-noctis-text w-48 focus:border-noctis-accent outline-none font-mono"
          placeholder="Search entities..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10">
            <tr className="bg-noctis-panel border-b border-noctis-border">
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`text-left text-[10px] font-semibold uppercase tracking-wider text-noctis-text-muted px-4 py-2.5 cursor-pointer hover:text-noctis-text transition-colors ${col.width}`}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1 text-noctis-accent">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((entity, idx) => (
              <motion.tr
                key={entity.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.02 }}
                onClick={() => setSelectedEntity(entity)}
                className={`border-b border-noctis-border/50 cursor-pointer transition-colors ${
                  selectedEntity?.id === entity.id
                    ? 'bg-noctis-accent/8'
                    : 'hover:bg-noctis-surface/30'
                }`}
              >
                <td className="px-4 py-2.5">
                  <span className="text-xs text-noctis-text-bright">{entity.name}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded"
                    style={{ color: ENTITY_COLORS[entity.type], background: `${ENTITY_COLORS[entity.type]}12`, border: `1px solid ${ENTITY_COLORS[entity.type]}25` }}
                  >
                    {entity.type}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 rounded-full bg-noctis-border overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${entity.risk}%`,
                          background: entity.risk >= 80 ? '#ff4545' : entity.risk >= 60 ? '#f85149' : entity.risk >= 40 ? '#e3b341' : '#3fb950'
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-mono" style={{
                      color: entity.risk >= 80 ? '#ff4545' : entity.risk >= 60 ? '#f85149' : entity.risk >= 40 ? '#e3b341' : '#3fb950'
                    }}>{entity.risk}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <span className="text-xs font-mono text-noctis-text-muted">{entity.connections}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${
                    entity.status === 'SUSPECT' || entity.status === 'MALICIOUS' || entity.status === 'SUSPICIOUS' ? 'severity-critical' :
                    entity.status === 'FLAGGED' || entity.status === 'COMPROMISED' ? 'severity-high' :
                    entity.status === 'MONITORED' || entity.status === 'PERSON OF INTEREST' ? 'severity-medium' :
                    'severity-low'
                  }`}>
                    {entity.status}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className="text-[10px] font-mono text-noctis-text-muted">
                    {entity.lastActivity !== '-' ? new Date(entity.lastActivity).toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : '-'}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
