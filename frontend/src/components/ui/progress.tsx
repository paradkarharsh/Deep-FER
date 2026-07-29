import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Progress — animated glassmorphic progress bar with shimmer effect.
// ---------------------------------------------------------------------------

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Current value (0-100) */
  value?: number;
  /** Gradient colour override — defaults to indigo->purple->cyan */
  color?: string;
  /** Track height */
  size?: "sm" | "md" | "lg";
  /** Enable width animation on mount */
  animated?: boolean;
  /** Optional label displayed above the bar */
  label?: string;
}

/** Maps size prop to Tailwind height classes */
const sizeClasses = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
} as const;

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      color,
      size = "md",
      animated = true,
      label,
      ...props
    },
    ref,
  ) => {
    // Clamp value between 0 and 100
    const clamped = Math.min(100, Math.max(0, value));

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        {/* Label row */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            {label && (
              <span className="text-xs font-medium text-white/70">{label}</span>
            )}
            <span className="text-xs tabular-nums text-white/50 ml-auto">
              {Math.round(clamped)}%
            </span>
          </div>
        </div>

        {/* Track */}
        <div
          className={cn(
            "w-full rounded-full overflow-hidden",
            "bg-white/10 backdrop-blur-sm",
            sizeClasses[size],
          )}
        >
          {/* Fill */}
          <motion.div
            className={cn(
              "h-full rounded-full relative",
              // Default gradient — can be overridden via `color`
              !color &&
                "bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500",
            )}
            style={color ? { backgroundColor: color } : undefined}
            /* Animate width from 0 to target */
            initial={animated ? { width: "0%" } : false}
            animate={{ width: `${clamped}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Shimmer overlay */}
            <div
              className={cn(
                "absolute inset-0",
                "bg-gradient-to-r from-transparent via-white/25 to-transparent",
                "animate-[shimmer_2s_infinite]",
              )}
              style={{
                backgroundSize: "200% 100%",
              }}
            />
          </motion.div>
        </div>
      </div>
    );
  },
);

Progress.displayName = "Progress";

export { Progress };
export type { ProgressProps };
