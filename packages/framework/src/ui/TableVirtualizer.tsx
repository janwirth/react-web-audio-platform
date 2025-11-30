import {
  useImperativeHandle,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useAtomValue } from "jotai";
import { useVirtualList } from "./hooks/useVirtualList";
import { debugViewAtom } from "../atoms/debugView";
import { VirtualListDebugHeader } from "./VirtualListDebugHeader";
import { Scrollbar } from "./Scrollbar";
import { useHorizontalScroll } from "./hooks/useHorizontalScroll";
import { useScrollFinish } from "../layout-and-control/hooks/useScrollFinish";

interface TableVirtualizerProps<T> {
  items: T[];
  itemHeight: number;
  overscan?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  onScroll?: (scrollTop: number) => void;
  onScrollFinish?: () => void;
  onFocus?: () => void;
  onEnter?: (item: T, index: number) => void;
  selectedIndex?: number;
  onSelectedIndexClamp?: (clampedIndex: number) => void;
  className?: string;
}

export interface TableVirtualizerHandle {
  scrollByRows: (deltaRows: number) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  scrollToIndex: (index: number) => void;
  scrollToIndexIfNeeded: (index: number) => void;
  getVisibleRange: () => { start: number; end: number };
  getFullyVisibleRange: () => { start: number; end: number };
  triggerEnter?: () => void;
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
    onScrollFinish,
    onFocus,
    onEnter,
    selectedIndex,
    onSelectedIndexClamp,
    className = "",
  },
  ref
) {
  const debugView = useAtomValue(debugViewAtom);
  const hookReturn = useVirtualList({
    items,
    itemHeight,
    overscan,
    onScroll,
    onFocus,
  });

  const {
    containerRef,
    scrollableRef,
    scrollTop,
    visibleItems,
    totalHeight,
    containerHeight,
    scrollByRows,
    scrollToTop,
    scrollToBottom,
    scrollToIndex,
    scrollToIndexIfNeeded,
    getVisibleRange,
    getFullyVisibleRange,
  } = hookReturn;

  const scrollbarSize = 12;

  // Calculate maximum scrollTop: we can scroll so the last item is at the top
  // This creates "overscroll padding" at the bottom equal to containerHeight
  const maxScrollTop = Math.max(0, (items.length - 1) * itemHeight);
  const needsVerticalScrollbar =
    maxScrollTop > 0 && totalHeight > containerHeight;

  // Track horizontal scroll
  const { scrollLeft, totalWidth, containerWidth, contentRef } =
    useHorizontalScroll(scrollableRef, visibleItems);

  // Track scroll finish events
  useScrollFinish(scrollableRef, onScrollFinish);

  // Track previous fully visible range to detect scroll changes
  const prevFullyVisibleRangeRef = useRef<{
    start: number;
    end: number;
  } | null>(null);

  // Clamp selectedIndex to fully visible range (without overscan) when scrolling
  useEffect(() => {
    if (
      selectedIndex === undefined ||
      !onSelectedIndexClamp ||
      items.length === 0
    ) {
      return;
    }

    const fullyVisibleRange = getFullyVisibleRange();
    const clampedIndex = Math.max(0, Math.min(items.length - 1, selectedIndex));

    // Check if the visible range has changed (scrolling happened)
    const rangeChanged =
      !prevFullyVisibleRangeRef.current ||
      prevFullyVisibleRangeRef.current.start !== fullyVisibleRange.start ||
      prevFullyVisibleRangeRef.current.end !== fullyVisibleRange.end;

    // Update the ref for next comparison
    prevFullyVisibleRangeRef.current = fullyVisibleRange;

    // Only clamp if scrolling happened and selectedIndex is outside the fully visible range
    if (
      rangeChanged &&
      (clampedIndex < fullyVisibleRange.start ||
        clampedIndex > fullyVisibleRange.end)
    ) {
      // Clamp to the nearest fully visible index
      const clampedToVisible = Math.max(
        fullyVisibleRange.start,
        Math.min(fullyVisibleRange.end, clampedIndex)
      );
      onSelectedIndexClamp(clampedToVisible);
    }
  }, [
    scrollTop,
    selectedIndex,
    onSelectedIndexClamp,
    items.length,
    getFullyVisibleRange,
  ]);

  // Handle vertical scrollbar
  const handleVerticalScroll = useCallback(
    (offset: number) => {
      const targetIndex = Math.floor(offset / itemHeight);
      scrollToIndex(targetIndex);
    },
    [itemHeight, scrollToIndex]
  );

  // Handle horizontal scrollbar
  const handleHorizontalScroll = useCallback(
    (offset: number) => {
      if (scrollableRef.current) {
        scrollableRef.current.scrollLeft = offset;
      }
    },
    [scrollableRef]
  );

  // Handle Enter key press
  const triggerEnter = useCallback(() => {
    if (
      onEnter &&
      selectedIndex !== undefined &&
      selectedIndex >= 0 &&
      selectedIndex < items.length
    ) {
      onEnter(items[selectedIndex], selectedIndex);
    }
  }, [onEnter, selectedIndex, items]);

  // Expose scroll methods via ref
  useImperativeHandle(
    ref,
    () => ({
      scrollByRows,
      scrollToTop,
      scrollToBottom,
      scrollToIndex,
      scrollToIndexIfNeeded,
      getVisibleRange,
      getFullyVisibleRange,
      triggerEnter: onEnter ? triggerEnter : undefined,
    }),
    [
      scrollByRows,
      scrollToTop,
      scrollToBottom,
      scrollToIndex,
      scrollToIndexIfNeeded,
      getVisibleRange,
      getFullyVisibleRange,
      triggerEnter,
      onEnter,
    ]
  );

  return (
    <div
      ref={containerRef}
      className={`flex flex-col ${className} flex-1 min-h-0`}
      style={{ position: "relative" }}
    >
      {debugView && (
        <VirtualListDebugHeader
          hookReturn={hookReturn}
          totalItems={items.length}
          itemHeight={itemHeight}
        />
      )}

      {/* Scrollable content */}
      <div
        ref={scrollableRef}
        tabIndex={0}
        className="flex-col flex basis-0 flex-1 overflow-hidden outline-none focglus:outline-none  grow"
        style={{ position: "relative" }}
      >
        <div
          ref={contentRef}
          style={{
            height: totalHeight,
            position: "relative",
            transform: `translate(${-scrollLeft}px, ${-scrollTop}px)`,
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

        {/* Vertical scrollbar */}
        {needsVerticalScrollbar && (
          <Scrollbar
            orientation="vertical"
            scrollOffset={scrollTop}
            totalSize={maxScrollTop + containerHeight}
            containerSize={containerHeight}
            onScroll={handleVerticalScroll}
            scrollbarSize={scrollbarSize}
            rightOffset={0}
          />
        )}

        {/* Horizontal scrollbar */}
        {totalWidth > containerWidth && (
          <Scrollbar
            orientation="horizontal"
            scrollOffset={scrollLeft}
            totalSize={totalWidth}
            containerSize={
              containerWidth - (needsVerticalScrollbar ? scrollbarSize : 0)
            }
            onScroll={handleHorizontalScroll}
            scrollbarSize={scrollbarSize}
            rightOffset={needsVerticalScrollbar ? scrollbarSize : 0}
          />
        )}
      </div>
    </div>
  );
});
