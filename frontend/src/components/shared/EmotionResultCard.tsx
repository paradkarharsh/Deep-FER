import { motion } from "framer-motion";
import { useAnimatedCounter } from "@/lib/hooks";
import { getEmotionResponse, getEmotionLabel } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface EmotionResultCardProps {
  emotion: string;
  confidence: number;
  description: string;
  color: string;
  detection_id: string;
  /** legacy — ignored in Apple HIG design */
  emoji?: string;
}

/* ------------------------------------------------------------------ */
/*  Confidence ring — Apple Health style                               */
/* ------------------------------------------------------------------ */

function ConfidenceRing({
  value,
  color,
}: {
  value: number;
  color: string;
}) {
  const size = 100;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const animatedValue = useAnimatedCounter(Math.round(value * 100), 1200);
  const offset = circumference - value * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--fill-tertiary)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-title-2 tabular-nums"
          style={{ color: "var(--label-primary)" }}
        >
          {animatedValue}%
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function EmotionResultCard({
  emotion,
  confidence,
  description,
  color,
  detection_id,
}: EmotionResultCardProps) {
  const recommended = getEmotionResponse(emotion);
  const label = getEmotionLabel(emotion);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1.0, 0.36, 1] }}
      className="apple-card p-6 w-full max-w-sm mx-auto"
    >
      {/* Top: colored dot + emotion name */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <h2
          className="text-title-2"
          style={{ color: "var(--label-primary)" }}
        >
          {label}
        </h2>
      </div>

      {/* Confidence ring */}
      <div className="flex justify-center mb-5">
        <ConfidenceRing value={confidence} color={color} />
      </div>

      {/* Description */}
      {description && (
        <p
          className="text-subheadline text-center mb-4"
          style={{ color: "var(--label-secondary)" }}
        >
          {description}
        </p>
      )}

      {/* Recommended response */}
      <div
        className="rounded-xl p-4 mb-3"
        style={{ background: "var(--bg-tertiary)" }}
      >
        <p
          className="text-caption-1 uppercase mb-1"
          style={{ color: "var(--label-tertiary)", letterSpacing: "0.04em" }}
        >
          Recommended response
        </p>
        <p
          className="text-subheadline font-medium"
          style={{ color: "var(--label-primary)" }}
        >
          {recommended}
        </p>
      </div>

      {/* Detection ID */}
      <p
        className="text-center text-caption-2 font-mono truncate"
        style={{ color: "var(--label-tertiary)" }}
      >
        ID: {detection_id}
      </p>
    </motion.div>
  );
}
