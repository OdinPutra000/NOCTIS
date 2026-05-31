import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useStore from './store/investigationStore';
import TopNavbar from './components/layout/TopNavbar';
import BottomStatusBar from './components/layout/BottomStatusBar';
import LeftSidebar from './components/sidebar/LeftSidebar';
import RightPanel from './components/panel/RightPanel';
import NQLPanel from './components/nql/NQLPanel';
import GraphView from './components/views/GraphView';
import TimelineView from './components/views/TimelineView';
import MapView from './components/views/MapView';
import TableView from './components/views/TableView';
import FlowView from './components/views/FlowView';
import GlobeView from './components/views/GlobeView';
import InvestigationMode from './components/investigation/InvestigationMode';

const VIEW_COMPONENTS = {
  graph: GraphView,
  timeline: TimelineView,
  map: MapView,
  table: TableView,
  flow: FlowView,
  globe: GlobeView,
};

export default function App() {
  const { activeView } = useStore();
  const ActiveViewComponent = VIEW_COMPONENTS[activeView] || GraphView;

  return (
    <div className="h-screen w-screen flex flex-col bg-noctis-bg overflow-hidden">
      {/* ZONE 1 — Top Navbar */}
      <TopNavbar />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* ZONE 2 — Left Sidebar */}
        <LeftSidebar />

        {/* ZONE 3 — Center Stage */}
        <main className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full"
            >
              <ActiveViewComponent />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* ZONE 4 — Right Analysis Panel */}
        <RightPanel />
      </div>

      {/* ZONE 5 — Bottom Status Bar */}
      <BottomStatusBar />

      {/* NQL Overlay */}
      <NQLPanel />

      {/* Investigation Mode Overlay */}
      <InvestigationMode />
    </div>
  );
}
