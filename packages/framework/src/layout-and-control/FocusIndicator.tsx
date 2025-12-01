import { motion } from "motion/react";

interface FocusIndicatorProps {
  variant?: "ping" | "dot";
  className?: string;
}

export function FocusIndicator({
  variant = "ping",
  className = "",
}: FocusIndicatorProps) {
  return (
    <motion.div
      layoutId="focus-indicator"
      className={`w-1.5 h-1.5 bg-red-500 shrink-0 ${className} absolute`}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.5, 1] }}
      transition={{
        duration: 0.2,
        ease: "easeOut",
      }}
    />
  );
}
