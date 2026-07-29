import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  Clock,
  Upload,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/lib/store";
import {
  getEmotionLabel,
  getEmotionColor,
  formatConfidence,
  getAllEmotions,
} from "@/lib/utils";
import type { HistoryEntry } from "@/lib/store";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function groupByDate(entries: HistoryEntry[]): [string, HistoryEntry[]][] {
  const groups = new Map<string, HistoryEntry[]>();
  for (const entry of entries) {
    const key = formatDate(entry.timestamp);
    const arr = groups.get(key) ?? [];
    arr.push(entry);
    groups.set(key, arr);
  }
  return Array.from(groups.entries());
}

/* ================================================================== */
/*  History Page                                                       */
/* ================================================================== */

export default function HistoryPage() {
  const { detectionHistory, clearHistory } = useAppStore();
  const [emotionFilter, setEmotionFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!emotionFilter) return detectionHistory;
    return detectionHistory.filter((e) => e.emotion === emotionFilter);
  }, [detectionHistory, emotionFilter]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  const allEmotions = getAllEmotions();

  const handleClear = useCallback(() => {
    clearHistory();
  }, [clearHistory]);

  return (
    <div className="pb-24 md:pb-0">
      <PageHeader
        title="History"
        description={`${detectionHistory.length} detection${detectionHistory.length !== 1 ? "s" : ""}`}
        action={
          detectionHistory.length > 0 ? (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleClear}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-subheadline font-medium cursor-pointer"
              style={{ color: "var(--system-red)", background: "var(--fill-tertiary)" }}
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </motion.button>
          ) : undefined
        }
      />

      {/* Emotion filter pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setEmotionFilter(null)}
          className="px-4 py-1.5 rounded-full text-footnote font-medium whitespace-nowrap transition-colors"
          style={{
            background: emotionFilter === null ? "var(--accent)" : "var(--fill-tertiary)",
            color: emotionFilter === null ? "white" : "var(--label-primary)",
          }}
        >
          All
        </button>
        {allEmotions.map((e) => (
          <button
            key={e}
            onClick={() => setEmotionFilter(emotionFilter === e ? null : e)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-footnote font-medium whitespace-nowrap transition-colors"
            style={{
              background: emotionFilter === e ? getEmotionColor(e) : "var(--fill-tertiary)",
              color: emotionFilter === e ? "white" : "var(--label-primary)",
            }}
          >
            <div
              className="w-[6px] h-[6px] rounded-full"
              style={{
                backgroundColor: emotionFilter === e ? "white" : getEmotionColor(e),
              }}
            />
            {getEmotionLabel(e)}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="apple-card p-8 text-center"
        >
          <Clock
            className="h-10 w-10 mx-auto mb-3"
            strokeWidth={1.5}
            style={{ color: "var(--label-tertiary)" }}
          />
          <p className="text-headline mb-1" style={{ color: "var(--label-primary)" }}>
            {detectionHistory.length === 0 ? "No history records" : "No results match filter"}
          </p>
          <p className="text-subheadline" style={{ color: "var(--label-secondary)" }}>
            {detectionHistory.length === 0
              ? "Results will appear here after analyzing photos or live camera"
              : "Try selecting a different emotion filter"
            }
          </p>
        </motion.div>
      )}

      {/* Grouped list */}
      <AnimatePresence>
        {grouped.map(([dateLabel, entries], gi) => (
          <motion.div
            key={dateLabel}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: gi * 0.05 }}
            className="mb-6"
          >
            <p className="apple-section-header">{dateLabel}</p>
            <div className="apple-card overflow-hidden">
              {entries.map((entry) => {
                const color = getEmotionColor(entry.emotion);
                const label = getEmotionLabel(entry.emotion);

                return (
                  <div key={entry.id} className="apple-row">
                    {entry.imageThumbnail ? (
                      <img
                        src={entry.imageThumbnail}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                        style={{ background: "var(--fill-tertiary)" }}
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center"
                        style={{ background: "var(--fill-tertiary)" }}
                      >
                        <Upload className="h-4 w-4" style={{ color: "var(--label-tertiary)" }} />
                      </div>
                    )}

                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className="w-[6px] h-[6px] rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-body truncate" style={{ color: "var(--label-primary)" }}>
                        {label}
                      </span>
                    </div>

                    <span
                      className="text-subheadline tabular-nums shrink-0"
                      style={{ color: "var(--label-secondary)" }}
                    >
                      {formatConfidence(entry.confidence)}
                    </span>

                    <span
                      className="text-footnote shrink-0 w-16 text-right"
                      style={{ color: "var(--label-tertiary)" }}
                    >
                      {formatTime(entry.timestamp)}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
