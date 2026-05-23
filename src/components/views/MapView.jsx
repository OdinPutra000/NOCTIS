import { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import useStore from '../../store/investigationStore';
import { ENTITY_COLORS } from '../../data/sampleCase';
import { Eye, EyeOff, Map, Layers, Navigation, AlertTriangle, HelpCircle } from 'lucide-react';

const mapStyleBlock = `
  @keyframes leafletFlow {
    to {
      stroke-dashoffset: -20;
    }
  }
  .leaflet-path-flow {
    stroke-dasharray: 6, 6;
    animation: leafletFlow 1.2s linear infinite !important;
  }
  .leaflet-path-flow-suspicious {
    stroke-dasharray: 5, 5;
    animation: leafletFlow 0.8s linear infinite !important;
  }
  .custom-marker-pulse {
    position: relative;
  }
  .custom-marker-pulse::after {
    content: '';
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    border-radius: 50%;
    border: 1px solid #ff1e1e;
    opacity: 0.8;
    animation: markerPulse 1.8s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
  }
  @keyframes markerPulse {
    0% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(2.2); opacity: 0.1; }
    100% { transform: scale(2.2); opacity: 0; }
  }
`;

export default function MapView() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const { entities, relationships, setSelectedEntity, activeCase, anomalies } = useStore();

  const [showPaths, setShowPaths] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showLinks, setShowLinks] = useState(false);

  const geoEntities = useMemo(() => 
    entities.filter(e => e.location?.lat && e.location?.lng),
    [entities]
  );

  // Compute geodivergence or suspicious movement routes
  const suspiciousRoutes = useMemo(() => {
    return anomalies.filter(an => an.type === 'unusual_movement' || an.type === 'geodivergence');
  }, [anomalies]);

  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined') return;
    
    // Dynamic import of Leaflet
    import('leaflet').then((L) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Initialize Map with dark custom tactical constraints
      const map = L.map(mapRef.current, {
        center: [32, 15],
        zoom: 2,
        zoomControl: true,
        attributionControl: false,
      });

      // Dark style tile layer (perfectly fits deep black aesthetics)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;

      // 1. DRAW NATIVE TACTICAL HEATMAP OVERLAY
      if (showHeatmap) {
        const densityPoints = {};
        
        // Count base entity geolocations
        geoEntities.forEach(e => {
          const key = `${e.location.lat.toFixed(1)},${e.location.lng.toFixed(1)}`;
          densityPoints[key] = (densityPoints[key] || 0) + 2.0;
        });

        // Collect and add location history density
        const locHist = activeCase?.locationHistory || {};
        Object.values(locHist).forEach(history => {
          history.forEach(loc => {
            const key = `${loc.lat.toFixed(1)},${loc.lng.toFixed(1)}`;
            densityPoints[key] = (densityPoints[key] || 0) + 1.0;
          });
        });

        // Render overlapping heatmap circles
        Object.entries(densityPoints).forEach(([coords, weight]) => {
          const [lat, lng] = coords.split(',').map(Number);
          const maxRadius = 350000; // 350km visual glow range
          
          // Outer visual aura
          L.circle([lat, lng], {
            radius: maxRadius * (0.6 + weight * 0.1),
            fillColor: '#ff1e1e',
            fillOpacity: Math.min(0.2, weight * 0.04),
            stroke: false,
            interactive: false
          }).addTo(map);

          // Inner hot core
          L.circle([lat, lng], {
            radius: maxRadius * 0.35,
            fillColor: '#ff1e1e',
            fillOpacity: Math.min(0.4, weight * 0.08),
            stroke: false,
            interactive: false
          }).addTo(map);
        });
      }

      // 2. DRAW MOVEMENT HISTORY PATHS (Location History routes)
      if (showPaths) {
        const locationHistory = activeCase?.locationHistory || {};
        
        Object.entries(locationHistory).forEach(([entityId, history]) => {
          if (history.length < 2) return;
          const entity = entities.find(e => e.id === entityId);
          const color = ENTITY_COLORS[entity?.type] || '#ff1e1e';
          
          // Chronologically sort location snapshots
          const sortedHistory = [...history].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          const latLngs = sortedHistory.map(loc => [loc.lat, loc.lng]);

          // Draw baseline route guide line
          const pathLine = L.polyline(latLngs, {
            color: color,
            weight: 1.5,
            opacity: 0.45,
            dashArray: '4,4'
          }).addTo(map);

          // Draw moving path overlay to show direction/flow
          const isSuspiciousEntity = entity?.risk >= 70;
          const flowLine = L.polyline(latLngs, {
            color: color,
            weight: 2,
            opacity: 0.75,
            className: isSuspiciousEntity ? 'leaflet-path-flow-suspicious' : 'leaflet-path-flow'
          }).addTo(map);

          // Add path label for source/destination
          if (entity) {
            flowLine.bindTooltip(`Movement path: ${entity.name}`, { sticky: true, className: 'tactical-tooltip' });
          }
        });
      }

      // 3. DRAW TACTICAL NETWORK RELATIONSHIPS LINKS
      if (showLinks) {
        relationships.forEach(rel => {
          const source = geoEntities.find(e => e.id === rel.source);
          const target = geoEntities.find(e => e.id === rel.target);
          if (source && target && source.location && target.location) {
            const isSusp = rel.suspicious;
            L.polyline(
              [[source.location.lat, source.location.lng], [target.location.lat, target.location.lng]],
              {
                color: isSusp ? '#ff1e1e' : '#333333',
                weight: isSusp ? 1.8 : 0.8,
                opacity: isSusp ? 0.6 : 0.25,
                dashArray: isSusp ? '6,3' : '3,6',
                className: isSusp ? 'leaflet-path-flow-suspicious' : ''
              }
            ).addTo(map);
          }
        });
      }

      // 4. ADD MARKERS FOR GEOLOCATED ENTITIES
      geoEntities.forEach(entity => {
        const color = ENTITY_COLORS[entity.type] || '#8b949e';
        const hasAnomaly = anomalies.some(an => an.affectedEntities.includes(entity.id));
        
        const markerClass = `custom-marker ${hasAnomaly ? 'custom-marker-pulse' : ''}`;
        
        const icon = L.divIcon({
          className: markerClass,
          html: `<div style="
            width: 13px;
            height: 13px;
            background: ${hasAnomaly ? '#ff1e1e' : color};
            border: 2px solid ${hasAnomaly ? '#ff1e1e' : '#000000'};
            border-radius: 50%;
            box-shadow: 0 0 10px ${hasAnomaly ? '#ff1e1e' : color}bb;
            cursor: pointer;
          "></div>`,
          iconSize: [13, 13],
          iconAnchor: [6.5, 6.5],
        });

        const marker = L.marker([entity.location.lat, entity.location.lng], { icon }).addTo(map);
        
        marker.bindPopup(`
          <div style="background:#0a0a0a; color:#d1d5db; padding:10px 14px; border-radius:3px; font-family:'JetBrains Mono',monospace; min-width:180px; border: 1px solid #ff1e1e/25;">
            <div style="font-size:11px; font-weight:700; color:${hasAnomaly ? '#ff1e1e' : color}; margin-bottom:4px; border-bottom:1px solid #222; pb-1;">
              ${entity.name.toUpperCase()}
            </div>
            <div style="font-size:8px; color:#5b5b5b; text-transform:uppercase; tracking:0.08em; font-weight:600;">
              TYPE: ${entity.type}
            </div>
            <div style="font-size:9px; margin-top:6px;">
              RISK SCORE: <span style="color:${entity.risk >= 70 ? '#ff1e1e' : entity.risk >= 40 ? '#f97316' : '#10b981'}; font-weight:bold;">${entity.risk}</span>
            </div>
            ${entity.location.label ? `<div style="font-size:9px; color:#8b8b8b; margin-top:4px;">LOCATION: ${entity.location.label}</div>` : ''}
            ${hasAnomaly ? `<div style="font-size:8.5px; color:#ff1e1e; font-weight:600; margin-top:6px; border-top:1px dashed #ff1e1e/30; pt-1;">⚠️ ANOMALIES ACTIVE</div>` : ''}
          </div>
        `, { className: 'noctis-popup' });

        marker.on('click', () => setSelectedEntity(entity));
      });

      // Fit bounds if we have entities
      if (geoEntities.length > 0) {
        const bounds = L.latLngBounds(geoEntities.map(e => [e.location.lat, e.location.lng]));
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 5 });
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [entities, relationships, geoEntities.length, showPaths, showHeatmap, showLinks, activeCase]);

  if (entities.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#000000]">
        <span className="font-mono text-sm text-[#4b5563]">No geolocation data. Load intelligence data.</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-[#000000]" id="map-intelligence-engine">
      <style dangerouslySetInnerHTML={{ __html: mapStyleBlock }} />
      
      <div ref={mapRef} className="w-full h-full" />

      {/* Map Control Bar Panel */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-2">
        <div className="bg-[#0a0a0a]/90 backdrop-blur border border-[#1a1a1a] rounded px-3 py-1.5 flex items-center gap-4">
          <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider flex items-center gap-1.5">
            <Map size={11} className="text-[#ff1e1e]" /> Map Overlay Controls
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPaths(!showPaths)}
              className={`flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded border transition-all ${
                showPaths ? 'bg-[#ff1e1e]/15 border-[#ff1e1e]/30 text-[#ff1e1e]' : 'bg-[#111111] border-[#222222] text-[#555555]'
              }`}
            >
              {showPaths ? <Eye size={10} /> : <EyeOff size={10} />} MOVEMENT PATHS
            </button>

            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded border transition-all ${
                showHeatmap ? 'bg-[#ff1e1e]/15 border-[#ff1e1e]/30 text-[#ff1e1e]' : 'bg-[#111111] border-[#222222] text-[#555555]'
              }`}
            >
              {showHeatmap ? <Eye size={10} /> : <EyeOff size={10} />} DENSITY HEAT
            </button>

            <button
              onClick={() => setShowLinks(!showLinks)}
              className={`flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded border transition-all ${
                showLinks ? 'bg-[#ff1e1e]/15 border-[#ff1e1e]/30 text-[#ff1e1e]' : 'bg-[#111111] border-[#222222] text-[#555555]'
              }`}
            >
              {showLinks ? <Eye size={10} /> : <EyeOff size={10} />} NETWORK LINKS
            </button>
          </div>
        </div>

        {suspiciousRoutes.length > 0 && (
          <div className="bg-[#0a0202]/95 border border-[#ff1e1e]/25 text-[9px] font-mono text-[#ff1e1e] p-2 rounded max-w-sm flex items-start gap-1.5 shadow-lg">
            <AlertTriangle size={12} className="flex-shrink-0 mt-0.5 text-[#ff1e1e]" />
            <div>
              <div className="font-bold uppercase tracking-wider">Suspicious Movement Alert</div>
              <div className="text-[8.5px] text-[#b5b5b5] mt-0.5">
                {suspiciousRoutes[0].explanation}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map Legend Overlay */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-4 right-4 z-[1000] bg-[#0a0a0a]/95 backdrop-blur border border-[#1a1a1a] rounded p-3 w-40 font-mono shadow-xl"
      >
        <div className="text-[8px] uppercase tracking-widest text-[#5b5b5b] mb-2 font-bold">LEGEND</div>
        <div className="space-y-1.5">
          {Object.entries(ENTITY_COLORS).slice(0, 5).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full border border-black/40" style={{ background: color, boxShadow: `0 0 4px ${color}88` }} />
              <span className="text-[9px] text-[#a5a5a5] uppercase">{type}</span>
            </div>
          ))}
          <div className="pt-2 mt-2 border-t border-[#161616]">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0 border-t border-dashed border-[#ff1e1e] animate-pulse" />
              <span className="text-[9px] text-[#ff1e1e] uppercase">Active Path</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2.5 h-2.5 rounded-full border border-black/40 bg-[#ff1e1e] custom-marker-pulse" />
              <span className="text-[9px] text-[#ff1e1e] uppercase font-bold">Threat Anomaly</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Entity tracker status */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-[#0a0a0a]/90 backdrop-blur border border-[#1a1a1a] rounded px-3 py-1 font-mono text-[9px] text-[#6b7280]">
        ACTIVE SATELLITE POSITIONING: <span className="text-white font-bold">{geoEntities.length} IN VIEW</span>
      </div>
    </div>
  );
}
