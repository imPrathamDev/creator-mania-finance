import { AnimatePresence, motion } from "motion/react";

// ── Reusable reveal wrapper ──────────────────────────────────────────────────

import React, { ReactNode } from "react";

export const RevealItem = ({
  children,
  index = 0,
}: {
  children: ReactNode;
  index?: number;
}) => (
  <motion.div
    className="w-full"
    initial={{ opacity: 0, filter: "blur(8px)", y: 24 }}
    animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
    exit={{ opacity: 0, filter: "blur(8px)", y: 24 }}
    transition={{
      duration: 0.4,
      delay: index * 0.12,
      ease: [0.25, 0.46, 0.45, 0.94],
    }}
  >
    {children}
  </motion.div>
);

// ── Reusable stagger group ───────────────────────────────────────────────────

export const RevealGroup = ({
  show,
  children,
}: {
  show: boolean;
  children: ReactNode;
}) => (
  <AnimatePresence initial={false}>
    {show && (
      <motion.div className="flex flex-col items-center gap-4 w-full">
        {React.Children.map(children, (child, i) => (
          <RevealItem index={i}>{child}</RevealItem>
        ))}
      </motion.div>
    )}
  </AnimatePresence>
);
