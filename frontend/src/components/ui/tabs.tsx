import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Tabs — glassmorphic tabs built on Radix Tabs.
// Active tab shows a gradient background with subtle glow.
// ---------------------------------------------------------------------------

// Root -----------------------------------------------------------------------

const Tabs = TabsPrimitive.Root;

// TabsList --------------------------------------------------------------------

const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex items-center gap-1 p-1",
      "rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

// TabsTrigger -----------------------------------------------------------------

const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap",
      "rounded-xl px-4 py-2 text-sm font-medium",
      "text-white/60 transition-all duration-300",
      "hover:text-white/80",
      // Focus
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40",
      // Active indicator — gradient bg + glow
      "data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500/80 data-[state=active]:to-purple-500/80",
      "data-[state=active]:text-white",
      "data-[state=active]:shadow-[0_0_12px_rgba(99,102,241,0.3)]",
      // Disabled
      "disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

// TabsContent -----------------------------------------------------------------

const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-3 rounded-2xl",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
