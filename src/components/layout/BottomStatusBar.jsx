import { motion } from 'framer-motion';
import useStore from '../../store/investigationStore';
import { getRiskLevel } from '../../engine/riskEngine';

export default function BottomStatusBar() {
  const { entities, relationships, lastAnalysisTime, analysisComplete, anomalies = [] } = useStore();
  const anomalyCount = anomalies.length;
  const avgRisk = entities.length > 0 ? Math.round(entities.reduce((s, e) => s + e.risk, 0) / entities.length) : 0;
  const riskLevel = getRiskLevel(avgRisk);
  const suspiciousCount = relationships.filter(r => r.suspicious).length;
  const criticalThreats = anomalies.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH').length;

  return (
    <motion.div
      initial={{ y: 32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="h-8 bg-noctis-panel border-t border-noctis-border flex items-center justify-between px-4 text-[10px] font-mono text-noctis-text-muted select-none"
    >
      <div className="flex items-center gap-4">
        <StatusItem label="ENTITIES" value={entities.length} />
        <StatusItem label="RELATIONSHIPS" value={relationships.length} />
        <StatusItem label="SUSPICIOUS" value={suspiciousCount} color={suspiciousCount > 0 ? 'text-[#ff1e1e]' : undefined} />
        <StatusItem label="ANOMALIES" value={anomalyCount} color={anomalyCount > 0 ? 'text-noctis-warning' : undefined} />
        <StatusItem label="CRITICAL THREATS" value={criticalThreats} color={criticalThreats > 0 ? 'text-[#ff1e1e]' : undefined} />
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-noctis-text-muted">OVERALL RISK:</span>
          <span className={
            riskLevel === 'CRITICAL' ? 'text-[#ff1e1e]' :
            riskLevel === 'HIGH' ? 'text-noctis-danger' :
            riskLevel === 'MEDIUM' ? 'text-noctis-warning' : 'text-noctis-success'
          }>{riskLevel}</span>
        </div>
        {lastAnalysisTime && (
          <div className="flex items-center gap-1.5">
            <span>BEHAVIORAL SCAN TIME:</span>
            <span className="text-noctis-text">{new Date(lastAnalysisTime).toLocaleTimeString('en-US', { hour12: false })}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${analysisComplete ? 'bg-noctis-success' : 'bg-noctis-text-muted'}`} />
          <span className={analysisComplete ? 'text-noctis-success' : ''}>
            {analysisComplete ? 'BEHAVIOR SCAN SECURE' : 'IDLE'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function StatusItem({ label, value, color }) {
  return (
    <div className="flex items-center gap-1.5">
      <span>{label}:</span>
      <span className={color || 'text-noctis-text-bright'}>{value}</span>
    </div>
  );
}
