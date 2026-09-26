"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return children;

  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.div
        key={pathname}
        variants={{
          enter: { opacity: 0, x: 18, clipPath: "inset(0 0 0 2%)" },
          center: { opacity: 1, x: 0, clipPath: "inset(0 0 0 0)" },
          exit: { opacity: 0, x: -10, clipPath: "inset(0 2% 0 0)" },
        }}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
