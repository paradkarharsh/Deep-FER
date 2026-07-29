import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Switch -- glassmorphic toggle built on Radix Switch.
// Gradient thumb when checked, smooth CSS transition.
// ---------------------------------------------------------------------------

const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer",
      "rounded-full border border-white/10",
      "transition-colors duration-300",
      // Unchecked -> glass track
      "bg-white/10",
      // Checked -> gradient track
      "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-indigo-500 data-[state=checked]:to-purple-500",
      // Focus
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40",
      // Disabled
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full shadow-lg",
        "transition-transform duration-300",
        // Unchecked -> white thumb
        "bg-white",
        // Checked -> gradient thumb with glow
        "data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-white data-[state=checked]:to-indigo-100",
        "data-[state=checked]:shadow-[0_0_8px_rgba(99,102,241,0.4)]",
        // Slide
        "translate-x-0.5 data-[state=checked]:translate-x-[22px]",
      )}
    />
  </SwitchPrimitive.Root>
));

Switch.displayName = "Switch";

export { Switch };
