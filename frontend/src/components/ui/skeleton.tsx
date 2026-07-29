import * as React from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Skeleton — glassmorphic shimmer loading placeholder.
//
// Uses a CSS @keyframes shimmer animation defined in the project styles:
//   @keyframes shimmer {
//     0%   { background-position: -200% 0; }
//     100% { background-position: 200% 0;  }
//   }
// ---------------------------------------------------------------------------

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Shape of the skeleton */
  variant?: "text" | "circular" | "rectangular";
}

/** Maps variant to Tailwind shape classes */
const variantClasses = {
  text: "h-4 w-full rounded-md",
  circular: "rounded-full aspect-square",
  rectangular: "rounded-xl w-full",
} as const;

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = "text", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Glass base
          "bg-white/5 backdrop-blur-sm",
          // Shimmer gradient overlay
          "relative overflow-hidden",
          "before:absolute before:inset-0",
          "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
          "before:animate-[shimmer_2s_infinite]",
          "before:[background-size:200%_100%]",
          // Variant shape
          variantClasses[variant],
          className,
        )}
        {...props}
      />
    );
  },
);

Skeleton.displayName = "Skeleton";

export { Skeleton };
export type { SkeletonProps };
