import { useImperativeHandle, forwardRef } from "react";
import {
  useVirtualList,
  type UseVirtualListReturn,
} from "../hooks/useVirtualList";

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
    scrollByRows,
    scrollToTop,
    scrollToBottom,
    scrollToIndex,
    scrollToIndexIfNeeded,
    getVisibleRange,
    getFullyVisibleRange,
  } = hookReturn;

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
      <VirtualListDebugHeader
        hookReturn={hookReturn}
        totalItems={items.length}
        itemHeight={itemHeight}
      />

      {/* Scrollable content */}
      <div
        ref={scrollableRef}
        tabIndex={0}
        className="flex-col flex basis-0 flex-1 overflow-hidden outline-none focglus:outline-none  grow"
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
