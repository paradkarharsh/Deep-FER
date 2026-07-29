import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Upload,
  Camera,
  ArrowRight,
  Clock,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAnimatedCounter } from "@/lib/hooks";
import {
  formatConfidence,
  getEmotionLabel,
  getEmotionColor,
} from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import type { HistoryEntry } from "@/lib/store";

/* ================================================================== */
/*  Helpers & Sample Data                                              */
/* ================================================================== */

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const SAMPLE_PHOTOS = [
  {
    id: "sample-happy",
    emotion: "happy",
    confidence: 0.942,
    image: "/samples/happy.jpg",
    label: "Happy Expression",
  },
  {
    id: "sample-neutral",
    emotion: "neutral",
    confidence: 0.885,
    image: "/samples/neutral.jpg",
    label: "Neutral Expression",
  },
  {
    id: "sample-surprised",
    emotion: "surprise",
    confidence: 0.917,
    image: "/samples/surprised.jpg",
    label: "Surprised Expression",
  },
];

function getThumbnail(entry: HistoryEntry): string {
  if (entry.imageThumbnail && entry.imageThumbnail.trim() !== "") {
    return entry.imageThumbnail;
  }
  const emotion = entry.emotion.toLowerCase();
  if (emotion === "happy") return "/samples/happy.jpg";
  if (emotion === "surprise") return "/samples/surprised.jpg";
  return "/samples/neutral.jpg";
}

/* ================================================================== */
/*  Stat Card — single metric                                          */
/* ================================================================== */

function StatCard({
  label,
  value,
  delay = 0,
}: {
  label: string;
  value: number;
  delay?: number;
}) {
  const animated = useAnimatedCounter(value, 1200);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1.0, 0.36, 1] }}
      className="apple-card p-5 flex-1 min-w-[140px]"
    >
      <p
        className="text-caption-1 uppercase mb-2"
        style={{ color: "var(--label-secondary)", letterSpacing: "0.04em", fontWeight: 600 }}
      >
        {label}
      </p>
      <p
        className="text-title-1 tabular-nums"
        style={{ color: "var(--label-primary)" }}
      >
        {animated}
      </p>
    </motion.div>
  );
}

/* ================================================================== */
/*  Quick Action Card with Photo Thumbnail                             */
/* ================================================================== */

function QuickAction({
  photoSrc,
  icon: Icon,
  title,
  description,
  onClick,
  delay = 0,
}: {
  photoSrc: string;
  icon: typeof Upload;
  title: string;
  description: string;
  onClick: () => void;
  delay?: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1.0, 0.36, 1] }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="apple-card p-4 text-left flex items-center gap-4 w-full cursor-pointer group"
      style={{ border: "none" }}
    >
      <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden shadow-sm">
        <img
          src={photoSrc}
          alt={title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: "rgba(0, 0, 0, 0.35)", backdropFilter: "blur(2px)" }}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-headline" style={{ color: "var(--label-primary)" }}>
          {title}
        </p>
        <p className="text-footnote" style={{ color: "var(--label-secondary)" }}>
          {description}
        </p>
      </div>

      <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: "var(--label-tertiary)" }} />
    </motion.button>
  );
}

/* ================================================================== */
/*  Recent Result Row                                                  */
/* ================================================================== */

function RecentRow({ entry }: { entry: HistoryEntry }) {
  const color = getEmotionColor(entry.emotion);
  const label = getEmotionLabel(entry.emotion);
  const thumbnail = getThumbnail(entry);

  return (
    <div className="apple-row">
      <img
        src={thumbnail}
        alt={label}
        className="w-10 h-10 rounded-lg object-cover shrink-0 shadow-xs"
        style={{ background: "var(--fill-tertiary)" }}
      />

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div
          className="w-[6px] h-[6px] rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span
          className="text-body truncate font-medium"
          style={{ color: "var(--label-primary)" }}
        >
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
        {timeAgo(entry.timestamp)}
      </span>
    </div>
  );
}

/* ================================================================== */
/*  Dashboard Page                                                     */
/* ================================================================== */

export default function DashboardPage() {
  const navigate = useNavigate();
  const { detectionHistory, stats } = useAppStore();

  const recentEntries = useMemo(() => {
    return detectionHistory.slice(0, 5);
  }, [detectionHistory]);

  return (
    <div className="pb-24 md:pb-0">
      <PageHeader
        title="DeepFER"
        description="Facial emotion recognition powered by deep learning"
      />

      <div className="flex gap-3 mb-6 overflow-x-auto">
        <StatCard label="Analyzed" value={stats.totalProcessed} delay={0} />
        <StatCard label="Sessions" value={stats.totalSessions} delay={0.06} />
        <StatCard label="Today" value={stats.todayCount} delay={0.12} />
      </div>

      <div className="space-y-3 mb-8">
        <QuickAction
          photoSrc="/samples/happy.jpg"
          icon={Upload}
          title="Upload Image"
          description="Analyze a photo for facial emotions"
          onClick={() => navigate("/upload")}
          delay={0.16}
        />
        <QuickAction
          photoSrc="/samples/neutral.jpg"
          icon={Camera}
          title="Live Camera"
          description="Real-time emotion detection from webcam"
          onClick={() => navigate("/live")}
          delay={0.22}
        />
      </div>

      {/* Sample Gallery */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.26, ease: [0.22, 1.0, 0.36, 1] }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-title-3" style={{ color: "var(--label-primary)" }}>
            Sample Gallery
          </h2>
          <span className="text-footnote" style={{ color: "var(--label-secondary)" }}>
            Tap photo to inspect
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {SAMPLE_PHOTOS.map((sample) => (
            <motion.div
              key={sample.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/upload")}
              className="apple-card overflow-hidden cursor-pointer group flex flex-col"
            >
              <div className="relative aspect-square w-full overflow-hidden bg-zinc-900">
                <img
                  src={sample.image}
                  alt={sample.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div
                  className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[11px] font-semibold text-white uppercase tracking-wider"
                  style={{
                    backgroundColor: getEmotionColor(sample.emotion),
                    backdropFilter: "blur(4px)",
                  }}
                >
                  {getEmotionLabel(sample.emotion)}
                </div>
              </div>
              <div className="p-2.5">
                <p className="text-caption-1 font-medium truncate" style={{ color: "var(--label-primary)" }}>
                  {sample.label}
                </p>
                <p className="text-caption-2 tabular-nums" style={{ color: "var(--label-secondary)" }}>
                  {formatConfidence(sample.confidence)} match
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Detections or Empty State */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.32, ease: [0.22, 1.0, 0.36, 1] }}
      >
        <div className="flex items-center justify-between mb-3 px-1">
          <h2
            className="text-title-3"
            style={{ color: "var(--label-primary)" }}
          >
            Recent Detections
          </h2>
          {recentEntries.length > 0 && (
            <button
              onClick={() => navigate("/history")}
              className="text-subheadline flex items-center gap-1"
              style={{ color: "var(--accent)" }}
            >
              See All
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {recentEntries.length > 0 ? (
          <div className="apple-card overflow-hidden">
            {recentEntries.map((entry) => (
              <RecentRow key={entry.id} entry={entry} />
            ))}
          </div>
        ) : (
          <div className="apple-card p-8 text-center">
            <Clock
              className="h-10 w-10 mx-auto mb-3"
              strokeWidth={1.5}
              style={{ color: "var(--label-tertiary)" }}
            />
            <p className="text-headline mb-1" style={{ color: "var(--label-primary)" }}>
              No recent results
            </p>
            <p className="text-subheadline" style={{ color: "var(--label-secondary)" }}>
              Upload an image or start the camera to begin
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
