import { motion } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface SegmentedControlProps {
  items: string[];
  selected: number;
  onChange: (index: number) => void;
}

/* ------------------------------------------------------------------ */
/*  Segmented Control — iOS-style with spring-physics sliding pill     */
/* ------------------------------------------------------------------ */

export function SegmentedControl({
  items,
  selected,
  onChange,
}: SegmentedControlProps) {
  return (
    <div
      className="relative flex rounded-[10px] p-[2px]"
      style={{ background: "var(--fill-primary)" }}
    >
      {items.map((item, i) => (
        <button
          key={item}
          onClick={() => onChange(i)}
          className="relative z-10 flex-1 py-[7px] px-4 text-subheadline font-medium text-center transition-colors duration-150 rounded-[8px]"
          style={{
            color: i === selected ? "var(--label-primary)" : "var(--label-secondary)",
          }}
        >
          {i === selected && (
            <motion.div
              layoutId="segmented-pill"
              className="absolute inset-0 rounded-[8px]"
              style={{
                background: "var(--bg-secondary)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
              }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
            />
          )}
          <span className="relative z-10">{item}</span>
        </button>
      ))}
    </div>
  );
}
