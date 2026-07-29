import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("apple-card p-8 text-center flex flex-col items-center", className)}
    >
      <Icon
        className="h-10 w-10 mb-3"
        strokeWidth={1.5}
        style={{ color: "var(--label-tertiary)" }}
      />
      <h3 className="text-headline mb-1" style={{ color: "var(--label-primary)" }}>
        {title}
      </h3>
      <p className="text-subheadline mb-4" style={{ color: "var(--label-secondary)" }}>
        {description}
      </p>
      {action && <div>{action}</div>}
    </motion.div>
  );
}
