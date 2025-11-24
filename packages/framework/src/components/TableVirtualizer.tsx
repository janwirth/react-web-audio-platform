import {
  useImperativeHandle,
  forwardRef,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useAtomValue } from "jotai";
import {
  useVirtualList,
  type UseVirtualListReturn,
} from "../hooks/useVirtualList";
import { debugViewAtom } from "../atoms/debugView";

interface VirtualListDebugHeaderProps<T> {
  hookReturn: UseVirtualListReturn<T>;
  totalItems: number;
  itemHeight: number;
}

function VirtualListDebugHeader<T>({
  hookReturn,
  totalItems,
  itemHeight,
}: VirtualListDebugHeaderProps<T>) {
  const {
    scrollTop,
    firstVisibleIndex,
    visibleRange,
    visibleItems,
    totalHeight,
    containerHeight,
    visibleRowCount,
    getFullyVisibleRange,
  } = hookReturn;

  const fullyVisibleRange = getFullyVisibleRange();
  const visibleItemsCount = visibleItems.length;

  const debugItems = [
    { label: "Scroll", value: `${scrollTop}px` },
    { label: "First Visible Index", value: firstVisibleIndex.toString() },
    {
      label: "Visible Range",
      value: `${visibleRange.start}-${visibleRange.end}`,
    },
    {
      label: "Fully Visible Range",
      value: `${fullyVisibleRange.start}-${fullyVisibleRange.end}`,
    },
    { label: "Total Items", value: totalItems.toString() },
    { label: "Visible Items Count", value: visibleItemsCount.toString() },
    { label: "Total Height", value: `${totalHeight}px` },
    { label: "Container Height", value: `${containerHeight}px` },
    { label: "Visible Row Count", value: visibleRowCount.toString() },
    { label: "Item Height", value: `${itemHeight}px` },
  ];

  return (
    <div className="px-4 py-2 text-xs font-mono border-b border-gray-300 dark:border-gray-700">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-1">
        {debugItems.map(({ label, value }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="opacity-60">{label}:</span>
            <span>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

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
  scrollToIndexIfNeeded: (index: number) => void;
  getVisibleRange: () => { start: number; end: number };
  getFullyVisibleRange: () => { start: number; end: number };
}

interface ScrollbarProps {
  orientation: "vertical" | "horizontal";
  scrollOffset: number;
  totalSize: number;
  containerSize: number;
  onScroll: (offset: number) => void;
  scrollbarSize?: number;
  rightOffset?: number;
}

function Scrollbar({
  orientation,
  scrollOffset,
  totalSize,
  containerSize,
  onScroll,
  scrollbarSize = 12,
  rightOffset = 0,
}: ScrollbarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef(0);
  const dragStartOffsetRef = useRef(0);

  const isVertical = orientation === "vertical";
  const scrollableSize = Math.max(0, totalSize - containerSize);
  const thumbSize =
    containerSize > 0 && totalSize > 0
      ? Math.max(20, (containerSize / totalSize) * containerSize)
      : containerSize;
  const thumbPosition =
    scrollableSize > 0
      ? (scrollOffset / scrollableSize) * (containerSize - thumbSize)
      : 0;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isDraggingRef.current = true;
      dragStartRef.current = isVertical ? e.clientY : e.clientX;
      dragStartOffsetRef.current = scrollOffset;
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [scrollOffset, isVertical]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current || !trackRef.current) return;

      const trackRect = trackRef.current.getBoundingClientRect();
      const trackSize = isVertical ? trackRect.height : trackRect.width;
      const mousePos = isVertical ? e.clientY : e.clientX;
      const trackStart = isVertical ? trackRect.top : trackRect.left;

      const relativePos = mousePos - trackStart - thumbSize / 2;
      const newThumbPosition = Math.max(
        0,
        Math.min(trackSize - thumbSize, relativePos)
      );
      const newScrollOffset =
        scrollableSize > 0
          ? (newThumbPosition / (trackSize - thumbSize)) * scrollableSize
          : 0;

      onScroll(newScrollOffset);
    },
    [isVertical, thumbSize, scrollableSize, onScroll]
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]);

  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      if (!trackRef.current || thumbRef.current?.contains(e.target as Node))
        return;

      const trackRect = trackRef.current.getBoundingClientRect();
      const trackSize = isVertical ? trackRect.height : trackRect.width;
      const clickPos = isVertical ? e.clientY : e.clientX;
      const trackStart = isVertical ? trackRect.top : trackRect.left;

      const relativePos = clickPos - trackStart - thumbSize / 2;
      const newThumbPosition = Math.max(
        0,
        Math.min(trackSize - thumbSize, relativePos)
      );
      const newScrollOffset =
        scrollableSize > 0
          ? (newThumbPosition / (trackSize - thumbSize)) * scrollableSize
          : 0;

      onScroll(newScrollOffset);
    },
    [isVertical, thumbSize, scrollableSize, onScroll]
  );

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  if (scrollableSize <= 0) return null;

  return (
    <div
      ref={trackRef}
      className={`absolute bg-black/10 dark:bg-white/10 ${
        isVertical ? "top-0 bottom-0 w-[12px]" : "bottom-0 left-0 h-[12px]"
      } cursor-pointer`}
      onClick={handleTrackClick}
      style={{
        [isVertical ? "width" : "height"]: `${scrollbarSize}px`,
        right: `${rightOffset}px`,
      }}
    >
      <div
        ref={thumbRef}
        className={`absolute bg-black/30 dark:bg-white/30 hover:bg-black/50 dark:hover:bg-white/50 transition-opacity ${
          isVertical ? "w-full" : "h-full"
        } cursor-grab active:cursor-grabbing`}
        style={{
          [isVertical ? "top" : "left"]: `${thumbPosition}px`,
          [isVertical ? "height" : "width"]: `${thumbSize}px`,
        }}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
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

  // Track horizontal scroll
  const [scrollLeft, setScrollLeft] = useState(0);
  const [totalWidth, setTotalWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollbarSize = 12;

  // Calculate maximum scrollTop: we can scroll so the last item is at the top
  // This creates "overscroll padding" at the bottom equal to containerHeight
  const maxScrollTop = Math.max(0, (items.length - 1) * itemHeight);
  const needsVerticalScrollbar =
    maxScrollTop > 0 && totalHeight > containerHeight;

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
      setScrollLeft(offset);
      if (scrollableRef.current) {
        scrollableRef.current.scrollLeft = offset;
      }
    },
    [scrollableRef]
  );

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
    }),
    [
      scrollByRows,
      scrollToTop,
      scrollToBottom,
      scrollToIndex,
      scrollToIndexIfNeeded,
      getVisibleRange,
      getFullyVisibleRange,
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
