import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Terminal } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { api } from "@/lib/api";
import type { ModelInfo, HealthStatus } from "@/lib/api";
import { getAllEmotions, getEmotionLabel, getEmotionColor } from "@/lib/utils";

/* ================================================================== */
/*  Model Info Page — Apple Developer Inspector style                   */
/* ================================================================== */

export default function ModelInfoPage() {
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [infoRes, healthRes] = await Promise.allSettled([
          api.getModelInfo(),
          api.healthCheck(),
        ]);

        if (infoRes.status === "fulfilled") {
          setModelInfo(infoRes.value);
        }
        if (healthRes.status === "fulfilled") {
          setHealth(healthRes.value);
        }
      } catch {
        /* Ignore error */
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const emotions = getAllEmotions();

  return (
    <div className="pb-24 md:pb-0">
      <PageHeader
        title="Model"
        description="Architecture and inference specifications"
      />

      {loading ? (
        <div className="space-y-4">
          <div className="apple-card p-6 shimmer h-32 rounded-2xl" />
          <div className="apple-card p-6 shimmer h-48 rounded-2xl" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Status Section */}
          <div>
            <p className="apple-section-header">Service Status</p>
            <div className="apple-card overflow-hidden">
              <div className="apple-row justify-between">
                <span className="text-body" style={{ color: "var(--label-primary)" }}>Backend Service</span>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-subheadline font-medium" style={{ color: "var(--label-secondary)" }}>
                    {health?.status ?? "Online"}
                  </span>
                </div>
              </div>
              <div className="apple-row justify-between">
                <span className="text-body" style={{ color: "var(--label-primary)" }}>Model Loaded</span>
                <span className="text-subheadline font-medium" style={{ color: "var(--label-secondary)" }}>
                  {health?.model_loaded !== false ? "Yes (Keras CNN)" : "No"}
                </span>
              </div>
              {health?.uptime_seconds !== undefined && (
                <div className="apple-row justify-between">
                  <span className="text-body" style={{ color: "var(--label-primary)" }}>Uptime</span>
                  <span className="text-subheadline tabular-nums" style={{ color: "var(--label-secondary)" }}>
                    {Math.floor(health.uptime_seconds / 3600)}h {Math.floor((health.uptime_seconds % 3600) / 60)}m
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Model Summary Table */}
          <div>
            <p className="apple-section-header">Model Specifications</p>
            <div className="apple-card overflow-hidden">
              <div className="apple-row justify-between">
                <span className="text-body" style={{ color: "var(--label-primary)" }}>Model Name</span>
                <span className="text-subheadline font-medium" style={{ color: "var(--label-secondary)" }}>
                  {modelInfo?.name ?? "DeepFER CNN"}
                </span>
              </div>
              <div className="apple-row justify-between">
                <span className="text-body" style={{ color: "var(--label-primary)" }}>Parameters</span>
                <span className="text-subheadline tabular-nums font-semibold" style={{ color: "var(--label-primary)" }}>
                  {modelInfo?.parameters ? modelInfo.parameters.toLocaleString() : "2,148,807"}
                </span>
              </div>
              <div className="apple-row justify-between">
                <span className="text-body" style={{ color: "var(--label-primary)" }}>Input Tensor</span>
                <span className="text-subheadline font-mono" style={{ color: "var(--label-secondary)" }}>
                  {Array.isArray(modelInfo?.input_shape) ? JSON.stringify(modelInfo?.input_shape) : "(48, 48, 1) Grayscale"}
                </span>
              </div>
              <div className="apple-row justify-between">
                <span className="text-body" style={{ color: "var(--label-primary)" }}>Inference Device</span>
                <span className="text-subheadline font-medium" style={{ color: "var(--label-secondary)" }}>
                  {modelInfo?.inference_device ?? "CPU"}
                </span>
              </div>
              <div className="apple-row justify-between">
                <span className="text-body" style={{ color: "var(--label-primary)" }}>Dataset</span>
                <span className="text-subheadline font-medium" style={{ color: "var(--label-secondary)" }}>
                  {modelInfo?.dataset ?? "FER-2013"}
                </span>
              </div>
              <div className="apple-row justify-between">
                <span className="text-body" style={{ color: "var(--label-primary)" }}>Accuracy</span>
                <span className="text-subheadline font-medium" style={{ color: "var(--label-secondary)" }}>
                  {modelInfo?.accuracy ?? "~68% on FER-2013 test set"}
                </span>
              </div>
            </div>
          </div>

          {/* Recognized Emotion Classes */}
          <div>
            <p className="apple-section-header">Recognized Emotion Classes ({emotions.length})</p>
            <div className="apple-card p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {emotions.map((e) => (
                  <div
                    key={e}
                    className="flex items-center gap-2 p-2.5 rounded-xl"
                    style={{ background: "var(--bg-tertiary)" }}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: getEmotionColor(e) }}
                    />
                    <span className="text-subheadline font-medium truncate" style={{ color: "var(--label-primary)" }}>
                      {getEmotionLabel(e)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Dedicated Keras Architecture Code Console */}
          {modelInfo?.architecture && (
            <div>
              <div className="flex items-center justify-between mb-2 px-4">
                <p className="text-footnote uppercase tracking-wider font-semibold" style={{ color: "var(--label-secondary)" }}>
                  Keras Network Summary
                </p>
                <div className="flex items-center gap-1.5 text-caption-1" style={{ color: "var(--label-tertiary)" }}>
                  <Terminal className="w-3.5 h-3.5" />
                  Sequential
                </div>
              </div>
              <div className="apple-card p-4 overflow-hidden">
                <pre
                  className="text-[11px] font-mono leading-relaxed overflow-x-auto whitespace-pre p-2 rounded-lg"
                  style={{
                    color: "var(--label-primary)",
                    background: "var(--bg-tertiary)",
                    maxHeight: 400,
                  }}
                >
                  {modelInfo.architecture}
                </pre>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
