import { AlertTriangle, TrendingUp, ShieldAlert, ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';
import useStore from '../../store/investigationStore';
import { ENTITY_COLORS } from '../../data/sampleCase';
import { User, Monitor, Mail, Phone, Globe, Link as LinkIcon, MapPin, Building, Calendar } from 'lucide-react';

const ENTITY_ICONS = {
  person: <User size={10} />,
  device: <Monitor size={10} />,
  email: <Mail size={10} />,
  phone: <Phone size={10} />,
  ip: <Globe size={10} />,
  domain: <LinkIcon size={10} />,
  location: <MapPin size={10} />,
  organization: <Building size={10} />,
  event: <Calendar size={10} />,
};

export default function ThreatSummary() {
  const { 
    anomalies = [], 
    operationalPatterns = [], 
    entities = [], 
    behaviorProfiles = {}, 
    setSelectedEntity,
    selectedEntity
  } = useStore();

  if (entities.length === 0) return null;

  // Anomaly severity counters
  const criticalCount = anomalies.filter(a => a.severity === 'CRITICAL').length;
  const highCount = anomalies.filter(a => a.severity === 'HIGH').length;
  const mediumCount = anomalies.filter(a => a.severity === 'MEDIUM').length;
  const lowCount = anomalies.filter(a => a.severity === 'LOW').length;

  // Filter top 4 highest risk/behavior entities
  const sortedEntities = [...entities]
    .map(ent => {
      const profile = behaviorProfiles[ent.id];
      const behaviorScore = profile ? profile.behaviorScore : ent.risk || 0;
      return { ...ent, behaviorScore };
    })
    .sort((a, b) => b.risk - a.risk)
    .slice(0, 4);

  return (
    <div className="p-3 font-mono border-b border-noctis-border/30">
      {/* SECTION 1: ANOMALIES SUMMARY */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#ff1e1e] animate-pulse" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-noctis-text-muted">Behavioral Threat Summary</span>
      </div>

      {/* Severity Counters Grid */}
      <div className="grid grid-cols-4 gap-1 mb-3 text-center">
        <div className="bg-black border border-[#222222] py-1 px-0.5 rounded">
          <div className="text-[14px] font-bold text-[#ff1e1e]">{criticalCount}</div>
          <div className="text-[7px] text-gray-500 uppercase tracking-tighter">CRIT</div>
        </div>
        <div className="bg-black border border-[#222222] py-1 px-0.5 rounded">
          <div className="text-[14px] font-bold text-noctis-danger">{highCount}</div>
          <div className="text-[7px] text-gray-500 uppercase tracking-tighter">HIGH</div>
        </div>
        <div className="bg-black border border-[#222222] py-1 px-0.5 rounded">
          <div className="text-[14px] font-bold text-noctis-warning">{mediumCount}</div>
          <div className="text-[7px] text-gray-500 uppercase tracking-tighter">MED</div>
        </div>
        <div className="bg-black border border-[#222222] py-1 px-0.5 rounded">
          <div className="text-[14px] font-bold text-noctis-success">{lowCount}</div>
          <div className="text-[7px] text-gray-500 uppercase tracking-tighter">LOW</div>
        </div>
      </div>

      {/* SECTION 2: ACTIVE PATTERNS */}
      {operationalPatterns.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5 text-[8px] uppercase tracking-wider text-gray-500 font-semibold">
            <span>Detected Patterns</span>
            <span className="text-[9px] text-[#ff1e1e] font-bold">{operationalPatterns.length} Active</span>
          </div>
          <div className="space-y-1 max-h-[85px] overflow-y-auto">
            {operationalPatterns.slice(0, 3).map((pat) => (
              <div 
                key={pat.id} 
                className="flex items-center justify-between text-[9px] bg-[#050505] border border-[#1a1a1a] rounded px-1.5 py-0.5 hover:border-[#ff1e1e]/40 transition-colors"
                title={pat.description}
              >
                <span className="text-gray-300 truncate max-w-[170px]">{pat.name}</span>
                <span className={`text-[7px] px-1 rounded uppercase font-semibold flex items-center gap-0.5 ${
                  pat.severity === 'CRITICAL' ? 'bg-[#ff1e1e]/15 text-[#ff1e1e]' : 'bg-[#e5b341]/10 text-[#e5b341]'
                }`}>
                  <ShieldAlert size={6} />
                  {pat.severity.slice(0, 4)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: TOP TARGETS / HIGH-RISK ENTITIES */}
      <div>
        <div className="text-[8px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5 flex justify-between items-center">
          <span>High Threat Targets</span>
          <span className="text-[7px] text-gray-600">Risk & Trend</span>
        </div>
        <div className="space-y-1">
          {sortedEntities.map(ent => {
            const isSelected = selectedEntity?.id === ent.id;
            const isEscalating = ent.riskTrend === 'ESCALATING';
            const isDeEscalating = ent.riskTrend === 'DE_ESCALATING';
            
            return (
              <div 
                key={ent.id}
                onClick={() => setSelectedEntity(ent)}
                className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-all ${
                  isSelected 
                    ? 'bg-[#ff1e1e]/10 border border-[#ff1e1e]/30' 
                    : 'bg-black border border-[#111] hover:border-[#ff1e1e]/20 hover:bg-[#050505]'
                }`}
              >
                {/* Icon with customized color */}
                <div 
                  className="w-5 h-5 rounded border flex items-center justify-center flex-shrink-0"
                  style={{ 
                    borderColor: `${ENTITY_COLORS[ent.type]}40`, 
                    color: ENTITY_COLORS[ent.type],
                    backgroundColor: `${ENTITY_COLORS[ent.type]}08`
                  }}
                >
                  {ENTITY_ICONS[ent.type] || <User size={10} />}
                </div>

                {/* Info block */}
                <div className="flex-1 min-w-0">
                  <div className={`text-[10px] font-bold truncate ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                    {ent.name}
                  </div>
                  <div className="text-[8px] text-gray-500 capitalize flex items-center gap-1 leading-none">
                    <span>{ent.type}</span>
                    <span>•</span>
                    <span className="truncate max-w-[100px]">{ent.id}</span>
                  </div>
                </div>

                {/* Score badge & Trend */}
                <div className="flex items-center gap-1.5">
                  <div className="flex flex-col items-end">
                    <span className={`text-[10px] font-bold ${
                      ent.behaviorScore >= 75 ? 'text-[#ff1e1e]' : ent.behaviorScore >= 50 ? 'text-[#e5b341]' : 'text-gray-400'
                    }`}>
                      {ent.behaviorScore}
                    </span>
                    <span className="text-[6px] text-gray-600 font-semibold tracking-tighter">BEHAVIOR</span>
                  </div>

                  <div className="flex items-center justify-center">
                    {isEscalating ? (
                      <ArrowUpRight size={10} className="text-[#ff1e1e] animate-pulse" />
                    ) : isDeEscalating ? (
                      <ArrowDownRight size={10} className="text-noctis-success" />
                    ) : (
                      <ArrowRight size={10} className="text-gray-500" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
