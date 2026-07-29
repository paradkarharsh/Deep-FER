import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "./Sidebar";

/**
 * Main application layout shell.
 * Simple flex container: sidebar (desktop) or tab bar (mobile) + content.
 * No animated background, no floating blobs.
 */
export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="relative flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      {/* Sidebar (desktop) / Tab bar (mobile) */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1.0, 0.36, 1] }}
              className="px-5 py-6 max-w-4xl mx-auto w-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
