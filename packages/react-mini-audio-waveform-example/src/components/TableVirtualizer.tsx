import {
  useRef,
  useEffect,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import useResizeObserver from "use-resize-observer";

interface TableVirtualizerProps<T> {
  items: T[];
  itemHeight: number;
  overscan?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  onScroll?: (scrollTop: number) => void;
  onFocus?: () => void;
  className?: string;
}

export interface TableVirtualizerHandle {
  scrollByRows: (deltaRows: number) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  scrollToIndex: (index: number) => void;
}

export const TableVirtualizer = forwardRef<
  TableVirtualizerHandle,
  TableVirtualizerProps<any>
>(function TableVirtualizer(
  {
    items,
    itemHeight,
    overscan = 3,
    renderItem,
    onScroll,
    onFocus,
    className = "",
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollableRef = useRef<HTMLDivElement>(null);
  const [firstVisibleIndex, setFirstVisibleIndex] = useState(0);
  const wheelAccumulatorRef = useRef(0);

  // Use useResizeObserver to measure scrollable container height
  const { height: containerHeight = 0 } = useResizeObserver({
    ref: scrollableRef as React.RefObject<Element>,
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

  // Expose scroll methods via ref
  useImperativeHandle(
    ref,
    () => ({
      scrollByRows,
      scrollToTop: () => setFirstVisibleIndex(0),
      scrollToBottom: () => {
        // Allow last row to be at top of viewport
        const endIndex = Math.max(0, items.length - 1);
        setFirstVisibleIndex(endIndex);
      },
      scrollToIndex,
    }),
    [scrollByRows, items.length, scrollToIndex]
  );

  // Calculate which items should be visible
  const calculateVisibleRange = useCallback(() => {
    const start = Math.max(0, firstVisibleIndex - overscan);
    const end = Math.min(
      items.length - 1,
      firstVisibleIndex + visibleRowCount + overscan
    );
    return { start, end };
  }, [firstVisibleIndex, visibleRowCount, overscan, items.length]);

  const [visibleRange, setVisibleRange] = useState(() =>
    calculateVisibleRange()
  );

  // Handle wheel events - accumulate until we have enough for a full row
  useEffect(() => {
    const container = containerRef.current;
    const scrollable = scrollableRef.current;
    if (!container || !scrollable) return;

    const handleWheel = (e: WheelEvent) => {
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
  const visibleItems: Array<{ item: any; index: number }> = [];
  for (let i = visibleRange.start; i <= visibleRange.end; i++) {
    if (i >= 0 && i < items.length) {
      visibleItems.push({ item: items[i], index: i });
    }
  }

  // Calculate visible items count
  const visibleItemsCount = visibleItems.length;

  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-full ${className}`}
      style={{ position: "relative" }}
    >
      {/* Header showing scroll info */}
      <div className="px-4 py-1 text-xs font-mono border-b border-gray-300 dark:border-gray-700 flex items-center gap-4">
        <span className="opacity-60">Scroll:</span>
        <span>{scrollTop}px</span>
        <span className="opacity-60">Offset:</span>
        <span>{firstVisibleIndex}</span>
        <span className="opacity-60">Total:</span>
        <span>{items.length}</span>
        <span className="opacity-60">Visible:</span>
        <span>{visibleItemsCount}</span>
      </div>

      {/* Scrollable content */}
      <div
        ref={scrollableRef}
        tabIndex={0}
        className="flex-1 overflow-hidden outline-none focus:outline-none"
        style={{ position: "relative" }}
      >
        <div
          style={{
            height: totalHeight,
            position: "relative",
            transform: `translateY(-${scrollTop}px)`,
          }}
        >
          {visibleItems.map(({ item, index }) => (
            <div
              key={index}
              style={{
                position: "absolute",
                top: index * itemHeight,
                height: itemHeight,
                width: "100%",
              }}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
