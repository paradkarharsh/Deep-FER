import { motion } from "framer-motion";
import { getEmotionColor, getEmotionLabel, formatConfidence } from "@/lib/utils";
import { useAnimatedCounter } from "@/lib/hooks";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface ConfidenceChartProps {
  probabilities: Record<string, number>;
  animated?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Sorted emotions helper                                             */
/* ------------------------------------------------------------------ */

function getSortedEmotions(probabilities: Record<string, number>) {
  return Object.entries(probabilities)
    .map(([emotion, value]) => ({ emotion, value }))
    .sort((a, b) => b.value - a.value);
}

/* ------------------------------------------------------------------ */
/*  Animated percentage                                                */
/* ------------------------------------------------------------------ */

function AnimatedPct({ value }: { value: number }) {
  const animated = useAnimatedCounter(Math.round(value * 100), 1200);
  return <>{animated}%</>;
}

/* ------------------------------------------------------------------ */
/*  Apple Health-style horizontal bars                                 */
/* ------------------------------------------------------------------ */

function HorizontalBars({
  sorted,
  animated,
}: {
  sorted: { emotion: string; value: number }[];
  animated: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {sorted.map((entry, i) => {
        const color = getEmotionColor(entry.emotion);
        const label = getEmotionLabel(entry.emotion);
        const pct = entry.value * 100;

        return (
          <div key={entry.emotion} className="flex items-center gap-3">
            {/* Accent dot */}
            <div
              className="w-[6px] h-[6px] rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />

            {/* Label */}
            <span
              className="w-[72px] text-subheadline shrink-0 truncate"
              style={{ color: "var(--label-primary)" }}
            >
              {label}
            </span>

            {/* Bar */}
            <div
              className="flex-1 h-2 rounded-full overflow-hidden"
              style={{ background: "var(--fill-tertiary)" }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
                initial={animated ? { width: 0 } : { width: `${pct}%` }}
                animate={{ width: `${pct}%` }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.05,
                  ease: "easeOut",
                }}
              />
            </div>

            {/* Percentage */}
            <span
              className="w-12 text-right text-footnote tabular-nums shrink-0"
              style={{ color: "var(--label-secondary)" }}
            >
              {animated ? <AnimatedPct value={entry.value} /> : formatConfidence(entry.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function ConfidenceChart({
  probabilities,
  animated = true,
}: ConfidenceChartProps) {
  const sorted = getSortedEmotions(probabilities);

  return (
    <div className="apple-card p-5">
      <h3
        className="text-footnote uppercase mb-4"
        style={{
          color: "var(--label-secondary)",
          letterSpacing: "0.04em",
          fontWeight: 600,
        }}
      >
        Confidence Breakdown
      </h3>
      <HorizontalBars sorted={sorted} animated={animated} />
    </div>
  );
}
