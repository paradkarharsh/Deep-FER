import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Apple Button Variants                                              */
/* ------------------------------------------------------------------ */

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "text-subheadline font-semibold transition-colors duration-150 cursor-pointer select-none",
    "rounded-xl disabled:pointer-events-none disabled:opacity-40",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-[var(--accent)] text-white hover:opacity-90",
        primary: "bg-[var(--accent)] text-white hover:opacity-90",
        secondary: "bg-[var(--fill-tertiary)] text-[var(--label-primary)] hover:bg-[var(--fill-secondary)]",
        ghost: "bg-transparent text-[var(--accent)] hover:bg-[var(--fill-tertiary)]",
        danger: "bg-[var(--system-red)] text-white hover:opacity-90",
      },
      size: {
        sm: "h-8 px-3 text-footnote rounded-lg",
        md: "h-10 px-4 text-subheadline rounded-xl",
        lg: "h-12 px-6 text-headline rounded-xl",
        icon: "h-9 w-9 p-0 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, onClick, children, disabled, type, style }, ref) => {
    if (asChild) {
      return (
        <Slot
          ref={ref}
          className={cn(buttonVariants({ variant, size, className }))}
        >
          {children}
        </Slot>
      );
    }

    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={disabled}
        onClick={onClick}
        style={style}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn(buttonVariants({ variant, size, className }))}
      >
        {children}
      </motion.button>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
export type { ButtonProps };
