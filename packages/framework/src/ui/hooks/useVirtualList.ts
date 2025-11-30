import { useRef, useEffect, useState, useCallback, RefObject } from "react";
import useResizeObserver from "use-resize-observer";

export interface UseVirtualListOptions<T> {
  items: T[];
  itemHeight: number;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  onFocus?: () => void;
}

export interface UseVirtualListReturn<T> {
  containerRef: RefObject<HTMLDivElement | null>;
  scrollableRef: RefObject<HTMLDivElement | null>;
  scrollTop: number;
  firstVisibleIndex: number;
  visibleRange: { start: number; end: number };
  visibleItems: Array<{ item: T; index: number }>;
  totalHeight: number;
  containerHeight: number;
  visibleRowCount: number;
  scrollByRows: (deltaRows: number) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  scrollToIndex: (index: number) => void;
  scrollToIndexIfNeeded: (index: number) => void;
  getVisibleRange: () => { start: number; end: number };
  getFullyVisibleRange: () => { start: number; end: number };
}

export interface UseVirtualListHandle {
  scrollByRows: (deltaRows: number) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  scrollToIndex: (index: number) => void;
  scrollToIndexIfNeeded: (index: number) => void;
  getVisibleRange: () => { start: number; end: number };
  getFullyVisibleRange: () => { start: number; end: number };
}

export function useVirtualList<T>(
  options: UseVirtualListOptions<T>
): UseVirtualListReturn<T> {
  const { items, itemHeight, overscan = 3, onScroll, onFocus } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollableRef = useRef<HTMLDivElement>(null);
  const [firstVisibleIndex, setFirstVisibleIndex] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const wheelAccumulatorRef = useRef(0);

  // Measure scrollable container viewport height (clientHeight, not scrollHeight)
  useEffect(() => {
    const measureHeight = () => {
      if (scrollableRef.current) {
        setContainerHeight(scrollableRef.current.clientHeight);
      }
    };

    measureHeight();
  }, []);

  // Use useResizeObserver to update when container size changes
  useResizeObserver({
    ref: scrollableRef as React.RefObject<Element>,
    onResize: () => {
      // Measure clientHeight to get the actual viewport height, not scrollHeight
      if (scrollableRef.current) {
        setContainerHeight(scrollableRef.current.clientHeight);
      }
    },
  });

  // Calculate how many rows fit in the container
  const visibleRowCount = Math.floor(containerHeight / itemHeight);

  // Calculate scrollTop from firstVisibleIndex (always aligned to row boundaries)
  const scrollTop = firstVisibleIndex * itemHeight;

  // Scroll by rows (discrete, terminal-like)
  const scrollByRows = useCallback(
    (deltaRows: number) => {
      setFirstVisibleIndex((prev) => {
        // Allow last row to be at top of viewport
        const maxFirstIndex = Math.max(0, items.length - 1);
        const newIndex = Math.max(0, Math.min(maxFirstIndex, prev + deltaRows));
        return newIndex;
      });
    },
    [items.length]
  );

  // Scroll to a specific index - makes it the first visible row
  const scrollToIndex = useCallback(
    (index: number) => {
      const clampedIndex = Math.max(0, Math.min(items.length - 1, index));
      // Make the focused row the first visible row
      setFirstVisibleIndex(clampedIndex);
    },
    [items.length]
  );

  // Calculate which items should be visible (includes overscan)
  const calculateVisibleRange = useCallback(() => {
    const start = Math.max(0, firstVisibleIndex - overscan);
    const end = Math.min(
      items.length - 1,
      firstVisibleIndex + visibleRowCount + overscan
    );
    return { start, end };
  }, [firstVisibleIndex, visibleRowCount, overscan, items.length]);

  // Calculate fully visible range (without overscan)
  const calculateFullyVisibleRange = useCallback(() => {
    const start = firstVisibleIndex;
    const end = Math.min(
      items.length - 1,
      firstVisibleIndex + visibleRowCount - 1
    );
    return { start, end };
  }, [firstVisibleIndex, visibleRowCount, items.length]);

  // Scroll to index only if it's outside the fully visible range
  const scrollToIndexIfNeeded = useCallback(
    (index: number) => {
      const clampedIndex = Math.max(0, Math.min(items.length - 1, index));
      const fullyVisibleRange = calculateFullyVisibleRange();

      // Only scroll if the index is outside the fully visible range
      if (clampedIndex < fullyVisibleRange.start) {
        // Index is above visible range, scroll so it becomes the first visible
        setFirstVisibleIndex(clampedIndex);
      } else if (clampedIndex > fullyVisibleRange.end) {
        // Index is below visible range, scroll so it becomes visible
        // Calculate how much to scroll: we want the index to be the last fully visible item
        const newFirstIndex = Math.max(0, clampedIndex - visibleRowCount + 1);
        setFirstVisibleIndex(newFirstIndex);
      }
      // If index is within range, do nothing
    },
    [items.length, calculateFullyVisibleRange, visibleRowCount]
  );

  const scrollToTop = useCallback(() => {
    setFirstVisibleIndex(0);
  }, []);

  const scrollToBottom = useCallback(() => {
    // Allow last row to be at top of viewport
    const endIndex = Math.max(0, items.length - 1);
    setFirstVisibleIndex(endIndex);
  }, [items.length]);

  const [visibleRange, setVisibleRange] = useState(() =>
    calculateVisibleRange()
  );

  // Handle wheel events - accumulate until we have enough for a full row
  useEffect(() => {
    const container = containerRef.current;
    const scrollable = scrollableRef.current;
    if (!container || !scrollable) return;

    const handleWheel = (e: WheelEvent) => {
      // Ignore zoom gestures (Ctrl/Cmd + wheel) - let browser handle them
      if (e.ctrlKey || e.metaKey) {
        return;
      }

      e.preventDefault();

      // Focus scrollable container on scroll
      if (onFocus && document.activeElement !== scrollable) {
        scrollable.focus();
        onFocus();
      }

      // Accumulate wheel delta
      wheelAccumulatorRef.current += e.deltaY;

      // Calculate how many rows to scroll based on accumulated delta
      const rowsToScroll = Math.floor(
        Math.abs(wheelAccumulatorRef.current) / itemHeight
      );

      if (rowsToScroll > 0) {
        const direction = wheelAccumulatorRef.current > 0 ? 1 : -1;
        scrollByRows(rowsToScroll * direction);
        // Keep remainder for next scroll
        wheelAccumulatorRef.current = wheelAccumulatorRef.current % itemHeight;
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [scrollByRows, itemHeight, onFocus]);

  // Handle click to focus
  useEffect(() => {
    const container = containerRef.current;
    const scrollable = scrollableRef.current;
    if (!container || !scrollable) return;

    const handleClick = () => {
      if (onFocus && document.activeElement !== scrollable) {
        scrollable.focus();
        onFocus();
      }
    };

    container.addEventListener("click", handleClick);

    return () => {
      container.removeEventListener("click", handleClick);
    };
  }, [onFocus]);

  // Handle touch events for mobile - also discrete row scrolling
  const touchStartYRef = useRef(0);
  const touchStartIndexRef = useRef(0);
  const touchRowsAccumulatorRef = useRef(0);

  useEffect(() => {
    const scrollable = scrollableRef.current;
    if (!scrollable) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartYRef.current = e.touches[0].clientY;
      touchStartIndexRef.current = firstVisibleIndex;
      touchRowsAccumulatorRef.current = 0;
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const deltaY = touchStartYRef.current - e.touches[0].clientY;
      const rowsDelta = Math.floor(deltaY / itemHeight);

      if (rowsDelta !== touchRowsAccumulatorRef.current) {
        const deltaRows = rowsDelta - touchRowsAccumulatorRef.current;
        touchRowsAccumulatorRef.current = rowsDelta;
        scrollByRows(deltaRows);
      }
    };

    scrollable.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    scrollable.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });

    return () => {
      scrollable.removeEventListener("touchstart", handleTouchStart);
      scrollable.removeEventListener("touchmove", handleTouchMove);
    };
  }, [scrollByRows, itemHeight, firstVisibleIndex]);

  // Update visible range when firstVisibleIndex changes
  useEffect(() => {
    const newRange = calculateVisibleRange();
    setVisibleRange(newRange);
    onScroll?.(scrollTop);
  }, [firstVisibleIndex, calculateVisibleRange, scrollTop, onScroll]);

  // Recalculate when items change
  useEffect(() => {
    const newRange = calculateVisibleRange();
    setVisibleRange(newRange);
  }, [items, calculateVisibleRange]);

  // Calculate total height
  const totalHeight = items.length * itemHeight;

  // Get visible items
  const visibleItems: Array<{ item: T; index: number }> = [];
  for (let i = visibleRange.start; i <= visibleRange.end; i++) {
    if (i >= 0 && i < items.length) {
      visibleItems.push({ item: items[i], index: i });
    }
  }

  return {
    containerRef,
    scrollableRef,
    scrollTop,
    firstVisibleIndex,
    visibleRange,
    visibleItems,
    totalHeight,
    containerHeight,
    visibleRowCount,
    scrollByRows,
    scrollToTop,
    scrollToBottom,
    scrollToIndex,
    scrollToIndexIfNeeded,
    getVisibleRange: () => calculateVisibleRange(),
    getFullyVisibleRange: () => calculateFullyVisibleRange(),
  };
}
