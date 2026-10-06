"use client";

import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";

export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return children;

  return <motion.div key={pathname} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}>{children}</motion.div>;
}
