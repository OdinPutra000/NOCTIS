import { useState } from 'react';
import { motion } from 'framer-motion';
import useStore from '../../store/investigationStore';
import { ENTITY_COLORS } from '../../data/sampleCase';
import { getRiskLevel, getRiskColor } from '../../engine/riskEngine';
import { User, Monitor, Mail, Phone, Globe, Link, MapPin, Building, Calendar } from 'lucide-react';

const ENTITY_ICONS = {
  person: <User size={16} />,
  device: <Monitor size={16} />,
  email: <Mail size={16} />,
  phone: <Phone size={16} />,
  ip: <Globe size={16} />,
  domain: <Link size={16} />,
  location: <MapPin size={16} />,
  organization: <Building size={16} />,
  event: <Calendar size={16} />,
};

export default function EntityDetails() {
  const { selectedEntity, entities, relationships, setSelectedEntity } = useStore();

  if (!selectedEntity) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <div className="w-12 h-12 rounded-lg bg-noctis-surface border border-noctis-border flex items-center justify-center mb-3">
          <span className="text-xl text-noctis-text-muted">◎</span>
        </div>
        <p className="text-xs text-noctis-text-muted">Select an entity to view details</p>
        <p className="text-[10px] text-noctis-text-muted/50 mt-1">Click a node in the graph or a row in the table</p>
      </div>
    );
  }

  const e = selectedEntity;
  const color = ENTITY_COLORS[e.type] || '#8b949e';
  const icon = ENTITY_ICONS[e.type] || '●';
  const riskLevel = getRiskLevel(e.risk);
  const riskColor = getRiskColor(e.risk);

  const connections = relationships.filter(r => r.source === e.id || r.target === e.id);
  const connectedEntities = connections.map(r => {
    const otherId = r.source === e.id ? r.target : r.source;
    const ent = entities.find(en => en.id === otherId);
    return ent ? { ...ent, relationship: r } : null;
  }).filter(Boolean);

  return (
    <motion.div
      key={e.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-noctis-text-bright truncate">{e.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color, background: `${color}12`, border: `1px solid ${color}25` }}>
              {e.type}
            </span>
            {e.status && (
              <span className="text-[9px] font-mono uppercase tracking-wider text-noctis-text-muted">{e.status}</span>
            )}
          </div>
        </div>
      </div>

      {/* Risk Score */}
      <div className="mb-4 p-3 rounded border border-noctis-border bg-noctis-surface/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-widest text-noctis-text-muted font-semibold">Risk Score</span>
          <span className="text-lg font-bold font-mono" style={{ color: riskColor }}>{e.risk}</span>
        </div>
        <div className="w-full h-2 rounded-full bg-noctis-border overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${e.risk}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: riskColor }}
          />
        </div>
        <div className="text-right mt-1">
          <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: riskColor }}>{riskLevel}</span>
        </div>
      </div>

      {/* Metadata */}
      {e.metadata && Object.keys(e.metadata).length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-widest text-noctis-text-muted font-semibold mb-2">Metadata</div>
          <div className="space-y-1.5">
            {Object.entries(e.metadata).filter(([k]) => k !== 'lastActivity').map(([key, value]) => (
              <div key={key} className="flex justify-between items-start gap-2">
                <span className="text-[10px] text-noctis-text-muted capitalize flex-shrink-0">{key.replace(/_/g, ' ')}</span>
                <span className="text-[10px] font-mono text-noctis-text text-right truncate">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connected Entities */}
      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-widest text-noctis-text-muted font-semibold mb-2">
          Connected Entities ({connectedEntities.length})
        </div>
        <div className="space-y-1 max-h-[200px] overflow-y-auto">
          {connectedEntities.map(ce => (
            <button
              key={ce.id}
              onClick={() => setSelectedEntity(ce)}
              className="w-full flex items-center gap-2 p-2 rounded border border-noctis-border/50 hover:border-noctis-border hover:bg-noctis-surface/30 transition-all text-left"
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ENTITY_COLORS[ce.type] }} />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-noctis-text truncate">{ce.name}</div>
                <div className="text-[9px] font-mono text-noctis-text-muted">{ce.relationship?.label}</div>
              </div>
              {ce.relationship?.suspicious && (
                <span className="text-[8px] text-noctis-danger font-mono">⚠</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Timeline */}
      <ActivityTimeline entityId={e.id} />

      {/* Actions */}
      <div className="flex flex-wrap gap-1.5">
        <button className="btn-primary text-[9px] uppercase tracking-wider">Flag</button>
        <button className="btn-primary text-[9px] uppercase tracking-wider">Add Note</button>
        <button className="btn-primary text-[9px] uppercase tracking-wider">Expand Network</button>
        <button className="btn-ghost text-[9px] uppercase tracking-wider border border-noctis-border">Export</button>
        <button className="btn-ghost text-[9px] uppercase tracking-wider border border-noctis-border">Trace</button>
      </div>
    </motion.div>
  );
}

function ActivityTimeline({ entityId }) {
  const { events } = useStore();
  const [showAll, setShowAll] = useState(false);

  const related = events
    .filter(ev => ev.entities?.includes(entityId))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (related.length === 0) return null;

  const displayed = showAll ? related : related.slice(0, 5);

  return (
    <div className="mb-4">
      <div className="text-[10px] uppercase tracking-widest text-noctis-text-muted font-semibold mb-2">
        Activity Timeline ({related.length})
      </div>
      <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
        {displayed.map(ev => (
          <div key={ev.id} className="flex gap-2 p-2 rounded border border-noctis-border/40 bg-noctis-surface/20">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-1.5 h-1.5 rounded-full mt-1" style={{
                background: ev.severity === 'critical' ? '#ff4545' : ev.severity === 'high' ? '#f85149' : ev.severity === 'medium' ? '#e3b341' : '#3fb950'
              }} />
              <div className="w-px flex-1 bg-noctis-border/30 mt-1" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-noctis-text font-medium truncate">{ev.title}</div>
              <div className="text-[9px] text-noctis-text-muted mt-0.5 truncate">{ev.description}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[8px] font-mono text-noctis-text-muted/60">
                  {new Date(ev.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {' '}
                  {new Date(ev.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className={`severity-${ev.severity} !text-[7px] !py-0 !px-1.5`}>{ev.severity?.toUpperCase()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {related.length > 5 && (
        <button onClick={() => setShowAll(!showAll)}
          className="text-[9px] text-noctis-text-muted hover:text-noctis-text mt-1.5 font-mono">
          {showAll ? '▲ Show less' : `▼ Show all ${related.length} events`}
        </button>
      )}
    </div>
  );
}
