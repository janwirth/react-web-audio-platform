import { useEffect, RefObject } from "react";

export function useScrollFinish(
  scrollableRef: RefObject<HTMLDivElement | null>,
  onScrollFinish?: () => void
): void {
  useEffect(() => {
    const scrollable = scrollableRef.current;
    if (!scrollable || !onScrollFinish) return;

    let scrollFinishTimeout: NodeJS.Timeout | null = null;

    const handleWheel = () => {
      // Clear existing timeout
      if (scrollFinishTimeout) {
        clearTimeout(scrollFinishTimeout);
      }

      // Set new timeout to fire onScrollFinish 150ms after last wheel event
      scrollFinishTimeout = setTimeout(() => {
        onScrollFinish();
        scrollFinishTimeout = null;
      }, 150);
    };

    scrollable.addEventListener("wheel", handleWheel, { passive: true });
    return () => {
      scrollable.removeEventListener("wheel", handleWheel);
      if (scrollFinishTimeout) {
        clearTimeout(scrollFinishTimeout);
      }
    };
  }, [scrollableRef, onScrollFinish]);
}

