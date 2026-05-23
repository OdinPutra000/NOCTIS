import useStore from '../../store/investigationStore';
import { ENTITY_COLORS } from '../../data/sampleCase';
import { User, Monitor, Mail, Phone, Globe, Link, MapPin, Building, Calendar } from 'lucide-react';

const ENTITY_TYPES = ['person', 'device', 'email', 'phone', 'ip', 'domain', 'location', 'organization', 'event'];

const ENTITY_ICONS = {
  person: <User size={12} />,
  device: <Monitor size={12} />,
  email: <Mail size={12} />,
  phone: <Phone size={12} />,
  ip: <Globe size={12} />,
  domain: <Link size={12} />,
  location: <MapPin size={12} />,
  organization: <Building size={12} />,
  event: <Calendar size={12} />,
};

export default function EntityFilters() {
  const { entityFilters, toggleEntityFilter, entities } = useStore();

  const countByType = (type) => entities.filter(e => e.type === type).length;

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-noctis-warning" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-noctis-text-muted">Entity Filters</span>
      </div>

      <div className="space-y-1">
        {ENTITY_TYPES.map(type => {
          const count = countByType(type);
          return (
            <label
              key={type}
              className="flex items-center gap-2 py-1 px-1.5 rounded cursor-pointer hover:bg-noctis-surface/50 transition-colors group"
            >
              <input
                type="checkbox"
                className="noctis-checkbox"
                checked={entityFilters[type]}
                onChange={() => toggleEntityFilter(type)}
                style={{ borderColor: entityFilters[type] ? ENTITY_COLORS[type] : undefined, backgroundColor: entityFilters[type] ? ENTITY_COLORS[type] : undefined }}
              />
              <span className="text-xs text-noctis-text group-hover:text-noctis-text-bright transition-colors capitalize flex-1 flex items-center gap-2">
                <span style={{ color: ENTITY_COLORS[type] }}>{ENTITY_ICONS[type]}</span> {type}
              </span>
              {count > 0 && (
                <span className="text-[9px] font-mono text-noctis-text-muted bg-noctis-surface px-1.5 rounded">
                  {count}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
