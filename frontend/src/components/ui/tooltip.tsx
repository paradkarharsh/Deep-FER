import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Tooltip — glassmorphic tooltip built on Radix UI.
// ---------------------------------------------------------------------------

const TooltipProvider = TooltipPrimitive.Provider;
const TooltipRoot = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

// ---------------------------------------------------------------------------
// TooltipContent
// ---------------------------------------------------------------------------

const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, children, ...props }, ref) => (
  <AnimatePresence>
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        asChild
        {...props}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 2 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 2 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className={cn(
            "z-50 overflow-hidden rounded-xl px-3 py-1.5",
            "bg-white/10 backdrop-blur-xl border border-white/10",
            "text-xs text-white shadow-xl",
            className,
          )}
        >
          {children}
        </motion.div>
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  </AnimatePresence>
));
TooltipContent.displayName = "TooltipContent";

// ---------------------------------------------------------------------------
// Convenience wrapper
// ---------------------------------------------------------------------------

interface TooltipProps {
  /** Tooltip text content */
  content: React.ReactNode;
  /** Trigger element */
  children: React.ReactNode;
  /** Preferred side */
  side?: "top" | "right" | "bottom" | "left";
  /** Alignment */
  align?: "start" | "center" | "end";
}

/**
 * Shorthand tooltip — wraps children in a Radix tooltip with glassmorphic
 * styling and Framer Motion entry animation.
 */
function Tooltip({ content, children, side, align }: TooltipProps) {
  return (
    <TooltipRoot>
      <TooltipTrigger asChild>
        <span className="inline-flex w-full">{children}</span>
      </TooltipTrigger>
      <TooltipContent side={side} align={align}>
        {content}
      </TooltipContent>
    </TooltipRoot>
  );
}
Tooltip.displayName = "Tooltip";

export {
  Tooltip,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
};

export type { TooltipProps };
