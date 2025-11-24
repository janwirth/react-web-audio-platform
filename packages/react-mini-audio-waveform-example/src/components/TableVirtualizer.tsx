import { useRef, useEffect, useState, useCallback } from "react";

interface TableVirtualizerProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  renderItem: (item: T, index: number, isSelected: boolean) => React.ReactNode;
  onScroll?: (scrollTop: number) => void;
  onSelectionChange?: (selectedIndex: number | null) => void;
  className?: string;
}

export function TableVirtualizer<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 3,
  renderItem,
  onScroll,
  onSelectionChange,
  className = "",
}: TableVirtualizerProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [firstVisibleIndex, setFirstVisibleIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const wheelAccumulatorRef = useRef(0);

  // Calculate how many rows fit in the container
  const visibleRowCount = Math.floor(containerHeight / itemHeight);
  
  // Calculate scrollTop from firstVisibleIndex (always aligned to row boundaries)
  const scrollTop = firstVisibleIndex * itemHeight;
  
  // Calculate which items should be visible
  const calculateVisibleRange = useCallback(() => {
    const start = Math.max(0, firstVisibleIndex - overscan);
    const end = Math.min(
      items.length - 1,
      firstVisibleIndex + visibleRowCount + overscan
    );
    return { start, end };
  }, [firstVisibleIndex, visibleRowCount, overscan, items.length]);

  const [visibleRange, setVisibleRange] = useState(() => calculateVisibleRange());

  // Scroll by rows (discrete, terminal-like)
  const scrollByRows = useCallback(
    (deltaRows: number) => {
      setFirstVisibleIndex((prev) => {
        const maxFirstIndex = Math.max(0, items.length - visibleRowCount);
        const newIndex = Math.max(0, Math.min(maxFirstIndex, prev + deltaRows));
        return newIndex;
      });
    },
    [items.length, visibleRowCount]
  );

  // Move selection
  const moveSelection = useCallback(
    (delta: number) => {
      setSelectedIndex((prev) => {
        if (prev === null) {
          const newIndex = Math.max(0, Math.min(items.length - 1, firstVisibleIndex));
          return newIndex;
        }
        const newIndex = Math.max(0, Math.min(items.length - 1, prev + delta));
        
        // Auto-scroll to keep selection visible
        if (newIndex < firstVisibleIndex) {
          setFirstVisibleIndex(newIndex);
        } else if (newIndex >= firstVisibleIndex + visibleRowCount) {
          setFirstVisibleIndex(Math.max(0, newIndex - visibleRowCount + 1));
        }
        
        return newIndex;
      });
    },
    [items.length, firstVisibleIndex, visibleRowCount]
  );

  // Toggle selection at current index
  const toggleSelection = useCallback(() => {
    if (selectedIndex !== null) {
      setSelectedIndex(null);
      onSelectionChange?.(null);
    } else {
      const indexToSelect = firstVisibleIndex;
      setSelectedIndex(indexToSelect);
      onSelectionChange?.(indexToSelect);
    }
  }, [selectedIndex, firstVisibleIndex, onSelectionChange]);

  // Handle wheel events - accumulate until we have enough for a full row
  // Only scroll when focused (focus-bounded scrolling)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Only handle wheel when container is focused
      if (!isFocused) return;
      
      e.preventDefault();
      
      // Accumulate wheel delta
      wheelAccumulatorRef.current += e.deltaY;
      
      // Calculate how many rows to scroll based on accumulated delta
      const rowsToScroll = Math.floor(Math.abs(wheelAccumulatorRef.current) / itemHeight);
      
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
  }, [scrollByRows, itemHeight, isFocused]);

  // Keyboard navigation with vim hjkl and selection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if container is focused
      if (document.activeElement !== container && !container.contains(document.activeElement)) {
        return;
      }

      switch (e.key) {
        case "ArrowDown":
        case "j":
          e.preventDefault();
          if (selectedIndex !== null) {
            moveSelection(1);
          } else {
            scrollByRows(1);
          }
          break;
        case "ArrowUp":
        case "k":
          e.preventDefault();
          if (selectedIndex !== null) {
            moveSelection(-1);
          } else {
            scrollByRows(-1);
          }
          break;
        case "PageDown":
          e.preventDefault();
          scrollByRows(visibleRowCount);
          break;
        case "PageUp":
          e.preventDefault();
          scrollByRows(-visibleRowCount);
          break;
        case "Home":
          e.preventDefault();
          setFirstVisibleIndex(0);
          if (selectedIndex !== null) {
            setSelectedIndex(0);
            onSelectionChange?.(0);
          }
          break;
        case "End":
          e.preventDefault();
          const endIndex = Math.max(0, items.length - visibleRowCount);
          setFirstVisibleIndex(endIndex);
          if (selectedIndex !== null) {
            const lastItemIndex = items.length - 1;
            setSelectedIndex(lastItemIndex);
            onSelectionChange?.(lastItemIndex);
          }
          break;
        case "x":
        case "X":
          e.preventDefault();
          toggleSelection();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [scrollByRows, visibleRowCount, items.length, selectedIndex, moveSelection, toggleSelection, onSelectionChange]);

  // Handle touch events for mobile - also discrete row scrolling
  const touchStartYRef = useRef(0);
  const touchStartIndexRef = useRef(0);
  const touchRowsAccumulatorRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
    };
  }, [scrollByRows, itemHeight, firstVisibleIndex]);

  // Handle focus events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    container.addEventListener("focus", handleFocus);
    container.addEventListener("blur", handleBlur);

    return () => {
      container.removeEventListener("focus", handleFocus);
      container.removeEventListener("blur", handleBlur);
    };
  }, []);

  // Update visible range when firstVisibleIndex changes
  useEffect(() => {
    const newRange = calculateVisibleRange();
    setVisibleRange(newRange);
    onScroll?.(scrollTop);
  }, [firstVisibleIndex, calculateVisibleRange, scrollTop, onScroll]);

  // Notify selection changes
  useEffect(() => {
    onSelectionChange?.(selectedIndex);
  }, [selectedIndex, onSelectionChange]);

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

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={`overflow-hidden outline-none focus:outline-none ${
        isFocused ? "ring-1 ring-gray-400 dark:ring-gray-600" : ""
      } ${className}`}
      style={{ height: containerHeight, position: "relative" }}
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
            {renderItem(item, index, selectedIndex === index)}
          </div>
        ))}
      </div>
    </div>
  );
}

