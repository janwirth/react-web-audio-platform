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
          className={`w-3 h-3 bg-red-500 shrink-0 absolute animate-ping blur-[2px] ${className}`}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.5, 1] }}
          transition={{
            duration: 0.2,
            ease: "easeOut",
          }}
        />
        <motion.div
          layoutId="focus-indicator"
          className={`w-2.5 h-2.5 bg-red-500 shrink-0 absolute ${className}`}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.5, 1] }}
          transition={{
            duration: 0.2,
            ease: "easeOut",
          }}
        />
      </>
    );
  }

  return (
    <motion.div
      layoutId="focus-indicator"
      className={`w-1.5 h-1.5 bg-red-500 shrink-0 ${className}`}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.5, 1] }}
      transition={{
        duration: 0.2,
        ease: "easeOut",
      }}
    />
  );
}
