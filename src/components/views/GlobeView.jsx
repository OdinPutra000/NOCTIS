import { useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import useStore from '../../store/investigationStore';
import { ENTITY_COLORS } from '../../data/sampleCase';

export default function GlobeView() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const { entities, relationships } = useStore();

  const geoEntities = useMemo(() => entities.filter(e => e.location?.lat && e.location?.lng), [entities]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    let rotation = 0;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = Math.min(cx, cy) * 0.6;

    function latLngToXY(lat, lng, rot) {
      const phi = (90 - lat) * Math.PI / 180;
      const theta = (lng + rot) * Math.PI / 180;
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = -radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      return { x: cx + x, y: cy + y, z, visible: z > -radius * 0.2 };
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Globe outline
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#30363d';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = 'rgba(13, 17, 23, 0.5)';
      ctx.fill();

      // Grid lines (latitude)
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        for (let lng = 0; lng <= 360; lng += 5) {
          const p = latLngToXY(lat, lng, rotation);
          if (p.visible) {
            if (lng === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
        }
        ctx.strokeStyle = 'rgba(48, 54, 61, 0.3)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Grid lines (longitude)
      for (let lng = 0; lng < 360; lng += 30) {
        ctx.beginPath();
        for (let lat = -90; lat <= 90; lat += 5) {
          const p = latLngToXY(lat, lng, rotation);
          if (p.visible) {
            if (lat === -90) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
        }
        ctx.strokeStyle = 'rgba(48, 54, 61, 0.3)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Connection arcs
      relationships.forEach(rel => {
        const source = geoEntities.find(e => e.id === rel.source);
        const target = geoEntities.find(e => e.id === rel.target);
        if (source && target) {
          const p1 = latLngToXY(source.location.lat, source.location.lng, rotation);
          const p2 = latLngToXY(target.location.lat, target.location.lng, rotation);
          if (p1.visible && p2.visible) {
            ctx.beginPath();
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2 - 20;
            ctx.moveTo(p1.x, p1.y);
            ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
            ctx.strokeStyle = rel.suspicious ? 'rgba(248, 81, 73, 0.4)' : 'rgba(88, 166, 255, 0.2)';
            ctx.lineWidth = rel.suspicious ? 1.5 : 0.8;
            ctx.stroke();
          }
        }
      });

      // Entity dots
      geoEntities.forEach(entity => {
        const p = latLngToXY(entity.location.lat, entity.location.lng, rotation);
        if (p.visible) {
          const color = ENTITY_COLORS[entity.type] || '#8b949e';
          // Glow
          ctx.beginPath();
          ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = color + '25';
          ctx.fill();
          // Dot
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }
      });

      rotation += 0.15;
      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [geoEntities, relationships]);

  if (entities.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-noctis-bg">
        <span className="font-mono text-sm text-noctis-text-muted">No data. Load intelligence data.</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-noctis-bg">
      <canvas ref={canvasRef} className="w-full h-full" />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute top-3 left-3 bg-noctis-panel/90 backdrop-blur border border-noctis-border rounded px-3 py-1.5"
      >
        <span className="text-[10px] font-mono text-noctis-text-muted">{geoEntities.length} geolocated entities · Rotating view</span>
      </motion.div>
    </div>
  );
}
