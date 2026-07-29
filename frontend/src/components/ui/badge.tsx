import * as React from "react";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Badge variants — small glassmorphic pills for status / labels / emotions.
// ---------------------------------------------------------------------------

const badgeVariants = cva(
  /* base */
  [
    "inline-flex items-center rounded-full px-3 py-1",
    "text-xs font-medium backdrop-blur-sm",
    "border transition-colors duration-200",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-white/10 border-white/10 text-white/90",
        success: "bg-emerald-500/15 border-emerald-500/20 text-emerald-400",
        warning: "bg-amber-500/15 border-amber-500/20 text-amber-400",
        danger: "bg-red-500/15 border-red-500/20 text-red-400",
        info: "bg-sky-500/15 border-sky-500/20 text-sky-400",
        /**
         * Emotion variant — accepts a dynamic `color` prop for the
         * background tint (e.g. per-emotion branding).
         * Falls back to indigo when no color is supplied.
         */
        emotion: "border-white/10 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

// ---------------------------------------------------------------------------
// Component types
// ---------------------------------------------------------------------------

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Dynamic background colour for the `emotion` variant.
   * Accepts any valid CSS colour value (hex, rgb, hsl, etc.).
   */
  color?: string;
}

// ---------------------------------------------------------------------------
// Badge component
// ---------------------------------------------------------------------------

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, color, style, ...props }, ref) => {
    // For the emotion variant, inject the colour as an inline background.
    const emotionStyle: React.CSSProperties | undefined =
      variant === "emotion" && color
        ? { backgroundColor: `${color}25`, ...style }
        : style;

    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        style={emotionStyle}
        {...props}
      />
    );
  },
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };
export type { BadgeProps };
