import {
  useRef,
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import { TableVirtualizer, TableVirtualizerHandle } from "./TableVirtualizer";
import { CoverFlow, CoverFlowRef } from "./CoverFlow";

export interface DualViewListItem {
  id: string | number;
  coverUrl?: string | null;
  [key: string]: any; // Allow additional properties
}

export interface DualViewListProps<T extends DualViewListItem> {
  items: T[];
  renderItem: (item: T, index: number, isSelected: boolean) => React.ReactNode;
  itemHeight?: number;
  overscan?: number;
  showCoverflow?: boolean;
  onCoverflowToggle?: (show: boolean) => void;
  coverflowHeight?: string;
  className?: string;
  initialCursorIndex?: number;
  onCursorChange?: (index: number) => void;
}

export interface DualViewListHandle {
  moveUp: () => void;
  moveDown: () => void;
  getCursorIndex: () => number;
  setCursorIndex: (index: number) => void;
}

export const DualViewList = forwardRef<
  DualViewListHandle,
  DualViewListProps<any>
>(function DualViewList<T extends DualViewListItem>(
  {
    items,
    renderItem,
    itemHeight = 64,
    overscan = 5,
    showCoverflow: controlledShowCoverflow,
    onCoverflowToggle,
    coverflowHeight = "200px",
    className = "",
    initialCursorIndex = 0,
    onCursorChange,
  },
  ref
) {
  const [internalShowCoverflow, setInternalShowCoverflow] = useState(true);
  const [cursorIndex, setCursorIndex] = useState(initialCursorIndex);
  const tableVirtualizerRef = useRef<TableVirtualizerHandle>(null);
  const coverFlowRef = useRef<CoverFlowRef>(null);
  const prevShowCoverflowRef = useRef(
    controlledShowCoverflow ?? internalShowCoverflow
  );

  // Notify parent when cursor changes
  useEffect(() => {
    onCursorChange?.(cursorIndex);
  }, [cursorIndex, onCursorChange]);

  // Use controlled or internal state for coverflow visibility
  const showCoverflow =
    controlledShowCoverflow !== undefined
      ? controlledShowCoverflow
      : internalShowCoverflow;

  // Sync coverflow to cursor when it opens
  useEffect(() => {
    const wasHidden = !prevShowCoverflowRef.current;
    const isNowVisible = showCoverflow;

    if (wasHidden && isNowVisible) {
      // Coverflow just opened, scroll it to cursor position after a brief delay to ensure ref is ready
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (coverFlowRef.current) {
            coverFlowRef.current.scrollToIndex(cursorIndex);
          }
        });
      });
    }

    prevShowCoverflowRef.current = showCoverflow;
  }, [showCoverflow, cursorIndex]);

  const handleToggleCoverflow = () => {
    const newValue = !showCoverflow;
    if (controlledShowCoverflow === undefined) {
      setInternalShowCoverflow(newValue);
    }
    onCoverflowToggle?.(newValue);
  };

  // Move cursor up
  const moveUp = useCallback(() => {
    setCursorIndex((prev) => {
      const newIndex = Math.max(0, prev - 1);
      // Scroll only if cursor would leave fully visible range
      setTimeout(() => {
        tableVirtualizerRef.current?.scrollToIndexIfNeeded(newIndex);
        // Sync coverflow if visible
        if (showCoverflow && coverFlowRef.current) {
          coverFlowRef.current.scrollToIndex(newIndex);
        }
      }, 0);
      return newIndex;
    });
  }, [showCoverflow]);

  // Move cursor down
  const moveDown = useCallback(() => {
    setCursorIndex((prev) => {
      const newIndex = Math.min(items.length - 1, prev + 1);
      // Scroll only if cursor would leave fully visible range
      setTimeout(() => {
        tableVirtualizerRef.current?.scrollToIndexIfNeeded(newIndex);
        // Sync coverflow if visible
        if (showCoverflow && coverFlowRef.current) {
          coverFlowRef.current.scrollToIndex(newIndex);
        }
      }, 0);
      return newIndex;
    });
  }, [items.length, showCoverflow]);

  // Expose imperative handle
  useImperativeHandle(
    ref,
    () => ({
      moveUp,
      moveDown,
      getCursorIndex: () => cursorIndex,
      setCursorIndex: (index: number) => {
        const clampedIndex = Math.max(0, Math.min(items.length - 1, index));
        setCursorIndex(clampedIndex);
        // Scroll only if cursor would leave fully visible range
        setTimeout(() => {
          tableVirtualizerRef.current?.scrollToIndexIfNeeded(clampedIndex);
          // Sync coverflow if visible
          if (showCoverflow && coverFlowRef.current) {
            coverFlowRef.current.scrollToIndex(clampedIndex);
          }
        }, 0);
      },
    }),
    [moveUp, moveDown, cursorIndex, items.length, showCoverflow]
  );

  // Transform items for CoverFlow
  const coverFlowItems = items.map((item) => ({
    id: `${item.id}`,
    title: item.title || item.name || `Item ${item.id}`,
    imgSrc: item.coverUrl,
  }));

  const handleFocussedItem = (_item: any, index: number) => {
    setCursorIndex(index);
    // Scroll only if cursor would leave fully visible range
    tableVirtualizerRef.current?.scrollToIndexIfNeeded(index);
  };

  return (
    <div className={`h-full flex flex-col gap-4 p-4 ${className}`}>
      {/* Toggle button */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleToggleCoverflow}
          className="font-mono text-sm border border-black dark:border-white px-3 py-1 hover:opacity-60 transition-opacity"
        >
          {showCoverflow ? "Hide" : "Show"} Coverflow
        </button>
      </div>

      {/* CoverFlow on top */}
      {showCoverflow && (
        <div style={{ height: coverflowHeight }}>
          <CoverFlow
            ref={coverFlowRef}
            items={coverFlowItems}
            onFocussedItem={handleFocussedItem}
          />
        </div>
      )}

      {/* TableVirtualizer below */}
      <div className="flex-1 min-h-0">
        <TableVirtualizer
          ref={tableVirtualizerRef}
          items={items}
          itemHeight={itemHeight}
          overscan={overscan}
          renderItem={(item, index) =>
            renderItem(item, index, index === cursorIndex)
          }
        />
      </div>
    </div>
  );
}) as <T extends DualViewListItem>(
  props: DualViewListProps<T> & { ref?: React.Ref<DualViewListHandle> }
) => React.ReactElement;
