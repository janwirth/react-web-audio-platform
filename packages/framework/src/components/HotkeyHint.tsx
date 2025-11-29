import { useState, useEffect, useRef } from "react";

export interface HotkeyHintProps {
  active?: boolean;
  matched?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export function HotkeyHint({
  active,
  matched,
  onClick,
  children,
}: HotkeyHintProps) {
  const [isHovered, setIsHovered] = useState(false);
  const prevHighlightedRef = useRef(false);
  const elementRef = useRef<HTMLElement>(null);
  const isHighlighted = Boolean(active || matched);
  const Component = onClick ? "button" : "div";

  // Manage transition timing: instant when becoming highlighted, transition when leaving
  useEffect(() => {
    const wasHighlighted = prevHighlightedRef.current;

    if (isHighlighted && !wasHighlighted) {
      // Becoming highlighted: disable transition immediately
      if (elementRef.current) {
        elementRef.current.style.transition =
          "opacity 0ms, background-color 0ms, color 0ms";
      }
    } else if (!isHighlighted && wasHighlighted) {
      // Leaving highlight: enable transition
      if (elementRef.current) {
        elementRef.current.style.transition =
          "opacity 150ms, background-color 150ms, color 150ms";
      }
    }

    prevHighlightedRef.current = isHighlighted;
  }, [isHighlighted]);

  // Handle hover transitions
  useEffect(() => {
    if (!elementRef.current) return;

    if (isHovered) {
      elementRef.current.style.transition =
        "opacity 0ms, background-color 0ms, color 0ms";
    } else if (!isHighlighted) {
      elementRef.current.style.transition =
        "opacity 150ms, background-color 150ms, color 150ms";
    }
  }, [isHovered, isHighlighted]);

  return (
    <Component
      ref={elementRef as any}
      onClick={onClick}
      className={`text-xs ${onClick ? "cursor-pointer" : "cursor-default"} ${
        isHighlighted
          ? "bg-black dark:bg-white text-white dark:text-black"
          : `text-black dark:text-white ${isHovered ? "opacity-85" : ""}`
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </Component>
  );
}

