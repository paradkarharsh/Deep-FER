import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/lib/store";

export default function SettingsPage() {
  const { theme, setTheme, clearHistory, detectionHistory } = useAppStore();

  const handleClearHistory = () => {
    clearHistory();
  };

  return (
    <div className="pb-24 md:pb-0">
      <PageHeader
        title="Settings"
        description="Preferences and app settings"
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div>
          <p className="apple-section-header">Appearance</p>
          <div className="apple-card overflow-hidden">
            <div className="apple-row justify-between">
              <span className="text-body" style={{ color: "var(--label-primary)" }}>Theme</span>
              <div
                className="flex rounded-lg p-0.5"
                style={{ background: "var(--fill-primary)" }}
              >
                <button
                  onClick={() => setTheme("light")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-footnote font-medium transition-all"
                  style={{
                    background: theme === "light" ? "var(--bg-secondary)" : "transparent",
                    color: theme === "light" ? "var(--label-primary)" : "var(--label-secondary)",
                    boxShadow: theme === "light" ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  <Sun className="w-3.5 h-3.5" />
                  Light
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-footnote font-medium transition-all"
                  style={{
                    background: theme === "dark" ? "var(--bg-secondary)" : "transparent",
                    color: theme === "dark" ? "var(--label-primary)" : "var(--label-secondary)",
                    boxShadow: theme === "dark" ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  <Moon className="w-3.5 h-3.5" />
                  Dark
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="apple-section-header">Data & Storage</p>
          <div className="apple-card overflow-hidden">
            <div className="apple-row justify-between">
              <div className="flex flex-col">
                <span className="text-body" style={{ color: "var(--label-primary)" }}>Stored History</span>
                <span className="text-footnote" style={{ color: "var(--label-secondary)" }}>
                  {detectionHistory.length} record{detectionHistory.length !== 1 ? "s" : ""} saved locally
                </span>
              </div>
              <button
                onClick={handleClearHistory}
                disabled={detectionHistory.length === 0}
                className="text-subheadline font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                style={{
                  color: detectionHistory.length > 0 ? "var(--system-red)" : "var(--label-tertiary)",
                  background: detectionHistory.length > 0 ? "var(--fill-tertiary)" : "transparent",
                  cursor: detectionHistory.length > 0 ? "pointer" : "default",
                }}
              >
                Clear History
              </button>
            </div>
          </div>
        </div>

        <div>
          <p className="apple-section-header">About</p>
          <div className="apple-card overflow-hidden">
            <div className="apple-row justify-between">
              <span className="text-body" style={{ color: "var(--label-primary)" }}>Application</span>
              <span className="text-subheadline font-medium" style={{ color: "var(--label-secondary)" }}>
                DeepFER
              </span>
            </div>
            <div className="apple-row justify-between">
              <span className="text-body" style={{ color: "var(--label-primary)" }}>Version</span>
              <span className="text-subheadline font-mono" style={{ color: "var(--label-secondary)" }}>
                2.0.0 (Apple HIG Edition)
              </span>
            </div>
            <div className="apple-row justify-between">
              <span className="text-body" style={{ color: "var(--label-primary)" }}>Model Core</span>
              <span className="text-subheadline font-medium" style={{ color: "var(--label-secondary)" }}>
                TensorFlow 2.x CNN
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
