import { motion } from 'framer-motion';
import DataIngestion from './DataIngestion';
import EntityFilters from './EntityFilters';
import ThreatSummary from './ThreatSummary';
import ActiveCases from './ActiveCases';
import ViewSwitcher from './ViewSwitcher';

export default function LeftSidebar() {
  return (
    <motion.aside
      initial={{ x: -320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="w-[320px] min-w-[320px] bg-noctis-panel border-r border-noctis-border flex flex-col overflow-hidden"
    >
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <DataIngestion />
        <div className="border-t border-noctis-border" />
        <EntityFilters />
        <div className="border-t border-noctis-border" />
        <ThreatSummary />
        <div className="border-t border-noctis-border" />
        <ActiveCases />
        <div className="border-t border-noctis-border" />
        <ViewSwitcher />
      </div>
    </motion.aside>
  );
}
