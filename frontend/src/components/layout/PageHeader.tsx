import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1.0, 0.36, 1] }}
      className={cn("mb-8", className)}
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1
            className="text-large-title"
            style={{ color: "var(--label-primary)" }}
          >
            {title}
          </h1>
          {description && (
            <p
              className="text-subheadline mt-1"
              style={{ color: "var(--label-secondary)" }}
            >
              {description}
            </p>
          )}
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>
    </motion.div>
  );
}
