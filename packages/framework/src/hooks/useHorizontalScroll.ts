import { useState, useEffect, useRef, RefObject } from "react";

interface UseHorizontalScrollReturn {
  scrollLeft: number;
  totalWidth: number;
  containerWidth: number;
  contentRef: RefObject<HTMLDivElement>;
}

export function useHorizontalScroll(
  scrollableRef: RefObject<HTMLDivElement | null>,
  visibleItems: unknown[]
): UseHorizontalScrollReturn {
  const [scrollLeft, setScrollLeft] = useState(0);
  const [totalWidth, setTotalWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Measure content width and container width
  useEffect(() => {
    const measureWidths = () => {
      if (scrollableRef.current && contentRef.current) {
        setContainerWidth(scrollableRef.current.clientWidth);
        setTotalWidth(contentRef.current.scrollWidth);
      }
    };

    measureWidths();
    const resizeObserver = new ResizeObserver(measureWidths);
    if (scrollableRef.current) {
      resizeObserver.observe(scrollableRef.current);
    }
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [scrollableRef, visibleItems]);

  // Sync horizontal scroll from native scroll events
  useEffect(() => {
    const scrollable = scrollableRef.current;
    if (!scrollable) return;

    const handleScroll = () => {
      setScrollLeft(scrollable.scrollLeft);
    };

    scrollable.addEventListener("scroll", handleScroll);
    return () => {
      scrollable.removeEventListener("scroll", handleScroll);
    };
  }, [scrollableRef]);

  return {
    scrollLeft,
    totalWidth,
    containerWidth,
    contentRef,
  };
}

