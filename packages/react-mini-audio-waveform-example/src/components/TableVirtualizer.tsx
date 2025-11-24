import { useRef, useEffect, useState, useCallback } from "react";

interface TableVirtualizerProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  onScroll?: (scrollTop: number) => void;
  className?: string;
}

export function TableVirtualizer<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 3,
  renderItem,
  onScroll,
  className = "",
}: TableVirtualizerProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTopRef = useRef(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });

  // Calculate which items should be visible
  const calculateVisibleRange = useCallback(
    (scrollTop: number) => {
      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const end = Math.min(
        items.length - 1,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
      );
      return { start, end };
    },
    [itemHeight, containerHeight, overscan, items.length]
  );

  // Handle wheel events to simulate scrolling without actual scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      const newScrollTop = Math.max(
        0,
        Math.min(
          items.length * itemHeight - containerHeight,
          scrollTopRef.current + e.deltaY
        )
      );
      scrollTopRef.current = newScrollTop;
      setScrollTop(newScrollTop);
      const newRange = calculateVisibleRange(newScrollTop);
      setVisibleRange(newRange);
      onScroll?.(newScrollTop);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [calculateVisibleRange, onScroll, itemHeight, containerHeight, items.length]);

  // Handle touch events for mobile
  const touchStartYRef = useRef(0);
  const touchStartScrollTopRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartYRef.current = e.touches[0].clientY;
      touchStartScrollTopRef.current = scrollTopRef.current;
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const deltaY = touchStartYRef.current - e.touches[0].clientY;
      const newScrollTop = Math.max(
        0,
        Math.min(
          items.length * itemHeight - containerHeight,
          touchStartScrollTopRef.current + deltaY
        )
      );
      scrollTopRef.current = newScrollTop;
      setScrollTop(newScrollTop);
      const newRange = calculateVisibleRange(newScrollTop);
      setVisibleRange(newRange);
      onScroll?.(newScrollTop);
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
    };
  }, [calculateVisibleRange, onScroll, itemHeight, containerHeight, items.length]);

  // Initial calculation
  useEffect(() => {
    const newRange = calculateVisibleRange(0);
    setVisibleRange(newRange);
  }, [calculateVisibleRange]);

  // Sync ref when state changes
  useEffect(() => {
    scrollTopRef.current = scrollTop;
  }, [scrollTop]);

  // Recalculate when items change
  useEffect(() => {
    const newRange = calculateVisibleRange(scrollTopRef.current);
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

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden ${className}`}
      style={{ height: containerHeight, position: "relative" }}
    >
      <div
        style={{
          height: totalHeight,
          position: "relative",
          transform: `translateY(-${scrollTop}px)`,
          willChange: "transform",
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
  );
}

