import * as React from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Input — glassmorphic text input with optional leading icon slot.
// ---------------------------------------------------------------------------

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Optional icon rendered on the left side of the input */
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", icon, ...props }, ref) => {
    return (
      <div className="relative w-full group">
        {/* Leading icon */}
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-indigo-400 transition-colors duration-200 pointer-events-none">
            {icon}
          </div>
        )}

        <input
          ref={ref}
          type={type}
          className={cn(
            // Base glass style
            "w-full bg-white/5 backdrop-blur-sm",
            "border border-white/10 rounded-xl",
            "px-4 py-2.5 text-sm text-white placeholder:text-white/30",
            // Focus ring
            "focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20",
            "focus:outline-none",
            "transition-all duration-200",
            // Disabled
            "disabled:opacity-50 disabled:cursor-not-allowed",
            // Icon padding
            icon && "pl-10",
            className,
          )}
          {...props}
        />

        {/* Animated focus glow */}
        <div
          className={cn(
            "absolute inset-0 -z-10 rounded-xl opacity-0",
            "bg-indigo-500/5",
            "group-focus-within:opacity-100",
            "transition-opacity duration-300",
          )}
        />
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
export type { InputProps };
