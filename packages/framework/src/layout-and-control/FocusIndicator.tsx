import { motion } from "motion/react";

interface FocusIndicatorProps {
  variant?: string;
  className?: string;
}

export function FocusIndicator({
  variant = "default",
  className = "",
}: FocusIndicatorProps) {
  return (
    <motion.div
      layoutId={`focus-indicator-${variant}`}
      className={`w-1.5 h-1.5 bg-red-500 shrink-0 ${className} absolute`}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 2.5, 1] }}
      transition={{
        duration: 0.15,
        ease: "circOut",
      }}
    />
  );
}
