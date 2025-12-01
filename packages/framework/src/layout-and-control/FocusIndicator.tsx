import { motion } from "motion/react";

interface FocusIndicatorProps {
  variant?: "ping" | "dot";
  className?: string;
}

export function FocusIndicator({
  variant = "ping",
  className = "",
}: FocusIndicatorProps) {
  if (variant === "ping") {
    return (
      <>
        <motion.div
          layoutId="focus-indicator-ping"
          className={`w-3 h-3 rounded-full bg-red-500 shrink-0 absolute animate-ping left-1 blur-[2px] ${className}`}
        />
        <motion.div
          layoutId="focus-indicator"
          className={`w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 absolute left-1 ${className}`}
        />
      </>
    );
  }

  return (
    <motion.div
      layoutId="focus-indicator"
      className={`w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 ${className}`}
    />
  );
}
