import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Dialog — glassmorphic modal built on Radix Dialog with Framer Motion
// entry / exit animations.
// ---------------------------------------------------------------------------

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

// ---------------------------------------------------------------------------
// DialogOverlay
// ---------------------------------------------------------------------------

const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay ref={ref} asChild {...props}>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "fixed inset-0 z-50",
        "bg-black/60 backdrop-blur-sm",
        className,
      )}
    />
  </DialogPrimitive.Overlay>
));
DialogOverlay.displayName = "DialogOverlay";

// ---------------------------------------------------------------------------
// DialogContent
// ---------------------------------------------------------------------------

const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <AnimatePresence>
      <DialogPrimitive.Content ref={ref} asChild {...props}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={cn(
            "fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
            "w-full max-w-lg p-6",
            // Glassmorphic panel
            "bg-white/5 backdrop-blur-2xl",
            "border border-white/10 rounded-2xl",
            "shadow-2xl",
            // Focus
            "focus:outline-none",
            className,
          )}
        >
          {children}

          {/* Close button */}
          <DialogPrimitive.Close
            className={cn(
              "absolute right-4 top-4",
              "rounded-full p-1.5",
              "text-white/40 hover:text-white",
              "bg-white/5 hover:bg-white/10",
              "transition-colors duration-200",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500/40",
            )}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </motion.div>
      </DialogPrimitive.Content>
    </AnimatePresence>
  </DialogPortal>
));
DialogContent.displayName = "DialogContent";

// ---------------------------------------------------------------------------
// DialogHeader
// ---------------------------------------------------------------------------

const DialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}
    {...props}
  />
));
DialogHeader.displayName = "DialogHeader";

// ---------------------------------------------------------------------------
// DialogFooter
// ---------------------------------------------------------------------------

const DialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4",
      className,
    )}
    {...props}
  />
));
DialogFooter.displayName = "DialogFooter";

// ---------------------------------------------------------------------------
// DialogTitle
// ---------------------------------------------------------------------------

const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-white", className)}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

// ---------------------------------------------------------------------------
// DialogDescription
// ---------------------------------------------------------------------------

const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-white/60", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
