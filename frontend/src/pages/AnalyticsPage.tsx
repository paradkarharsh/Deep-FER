import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/lib/store";
import {
  getEmotionLabel,
  getEmotionColor,
  getAllEmotions,
} from "@/lib/utils";
import { useAnimatedCounter } from "@/lib/hooks";

/* ================================================================== */
/*  Summary Metric Card                                                */
/* ================================================================== */

function MetricCard({
  label,
  value,
  suffix = "",
  delay = 0,
}: {
  label: string;
  value: number;
  suffix?: string;
  delay?: number;
}) {
  const animated = useAnimatedCounter(value, 1200);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1.0, 0.36, 1] }}
      className="apple-card p-5"
    >
      <p
        className="text-caption-1 uppercase mb-2"
        style={{ color: "var(--label-secondary)", letterSpacing: "0.04em", fontWeight: 600 }}
      >
        {label}
      </p>
      <p className="text-title-1 tabular-nums" style={{ color: "var(--label-primary)" }}>
        {animated}{suffix}
      </p>
    </motion.div>
  );
}

/* ================================================================== */
/*  Emotion Distribution Bar                                           */
/* ================================================================== */

function EmotionBar({
  emotion,
  count,
  total,
  delay,
}: {
  emotion: string;
  count: number;
  total: number;
  delay: number;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  const color = getEmotionColor(emotion);
  const label = getEmotionLabel(emotion);

  return (
    <div className="flex items-center gap-3">
      <div
        className="w-[6px] h-[6px] rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <span
        className="w-[72px] text-subheadline shrink-0"
        style={{ color: "var(--label-primary)" }}
      >
        {label}
      </span>
      <div
        className="flex-1 h-2 rounded-full overflow-hidden"
        style={{ background: "var(--fill-tertiary)" }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, delay, ease: "easeOut" }}
        />
      </div>
      <span
        className="w-10 text-right text-footnote tabular-nums shrink-0"
        style={{ color: "var(--label-secondary)" }}
      >
        {count}
      </span>
    </div>
  );
}

/* ================================================================== */
/*  Analytics Page                                                     */
/* ================================================================== */

export default function AnalyticsPage() {
  const { detectionHistory, stats } = useAppStore();

  const emotionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of getAllEmotions()) counts[e] = 0;
    for (const entry of detectionHistory) {
      const key = entry.emotion.toLowerCase();
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [detectionHistory]);

  const topEmotion = useMemo(() => {
    const sorted = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] ?? "neutral";
  }, [emotionCounts]);

  const avgConf = Math.round(stats.avgConfidence * 100);

  return (
    <div className="pb-24 md:pb-0">
      <PageHeader
        title="Analytics"
        description="Emotion detection insights"
      />

      <div className="grid grid-cols-2 gap-3 mb-6">
        <MetricCard label="Total Analyzed" value={stats.totalProcessed} delay={0} />
        <MetricCard label="Avg Confidence" value={avgConf} suffix="%" delay={0.06} />
        <MetricCard label="Sessions" value={stats.totalSessions} delay={0.12} />
        <MetricCard label="Today" value={stats.todayCount} delay={0.18} />
      </div>

      {detectionHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.24, ease: [0.22, 1.0, 0.36, 1] }}
          className="apple-card p-5 mb-6"
        >
          <p
            className="text-caption-1 uppercase mb-2"
            style={{ color: "var(--label-secondary)", letterSpacing: "0.04em", fontWeight: 600 }}
          >
            Most Detected
          </p>
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getEmotionColor(topEmotion) }}
            />
            <span className="text-title-2" style={{ color: "var(--label-primary)" }}>
              {getEmotionLabel(topEmotion)}
            </span>
            <span className="text-headline tabular-nums ml-auto" style={{ color: "var(--label-secondary)" }}>
              {emotionCounts[topEmotion] ?? 0}×
            </span>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3, ease: [0.22, 1.0, 0.36, 1] }}
      >
        <p className="apple-section-header">Distribution</p>
        <div className="apple-card p-5">
          <div className="flex flex-col gap-3">
            {getAllEmotions().map((e, i) => (
              <EmotionBar
                key={e}
                emotion={e}
                count={emotionCounts[e] ?? 0}
                total={detectionHistory.length}
                delay={0.35 + i * 0.05}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {detectionHistory.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="apple-card p-8 text-center mt-6"
        >
          <BarChart3
            className="h-10 w-10 mx-auto mb-3"
            strokeWidth={1.5}
            style={{ color: "var(--label-tertiary)" }}
          />
          <p className="text-headline mb-1" style={{ color: "var(--label-primary)" }}>
            No data yet
          </p>
          <p className="text-subheadline" style={{ color: "var(--label-secondary)" }}>
            Analyze some images to see insights here
          </p>
        </motion.div>
      )}
    </div>
  );
}
