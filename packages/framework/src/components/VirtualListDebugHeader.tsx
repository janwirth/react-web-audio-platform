import type { UseVirtualListReturn } from "../hooks/useVirtualList";

interface VirtualListDebugHeaderProps<T> {
  hookReturn: UseVirtualListReturn<T>;
  totalItems: number;
  itemHeight: number;
}

export function VirtualListDebugHeader<T>({
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


