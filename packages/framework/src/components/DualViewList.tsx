import {
  useRef,
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useMemo,
} from "react";
import { TableVirtualizer, TableVirtualizerHandle } from "./TableVirtualizer";
import { CoverFlowRef } from "./CoverFlow";
import { CoverFlowV2 } from "./coverflowV2";
import { Waveform, WaveformWithPlayhead } from "../media/waveform";
import { useAudioItems } from "@/hooks/useAudioItems";
import { QueueItem } from "../media/player/Player";
import { useIsPanelFocused } from "@/hooks/usePanelEvent";

export interface DualViewListItem {
  id: string | number;
  coverUrl: string | null;
  title?: string;
  name?: string;
  description?: string;
  audioUrl?: string;
  [key: string]: any; // Allow additional properties
}

export interface DualViewListProps {
  className?: string;
}

export interface DualViewListHandle {
  moveUp: () => void;
  moveDown: () => void;
  getCursorIndex: () => number;
  setCursorIndex: (index: number) => void;
}

// Settings - kept in file
const ITEM_HEIGHT = 64;
const OVERSCAN = 5;
const COVERFLOW_HEIGHT = "200px";
const INITIAL_CURSOR_INDEX = 0;

// Render item function - kept in file
function RenderItemComponent({
  item,
  index,
  allItems,
  isSelected,
  isPanelFocused,
}: {
  item: DualViewListItem;
  _index: number;
  allItems: QueueItem[];
  isSelected: boolean;
  isPanelFocused: boolean;
}) {
  console.log("item", item);
  return (
    <div
      className="dark:border-gray-800 hover:opacity-60 transition-opacity font-mono text-sm relative flex items-center gap-2"
      style={{
        backgroundColor: isSelected
          ? "rgba(128, 128, 128, 0.15)"
          : "transparent",
      }}
    >
      {isSelected && isPanelFocused && (
        <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
      )}
      <div className="text-gray-500 dark:text-gray-400 w-12">#{item.id}</div>
      {item.coverUrl && (
        <div className="w-12 h-12 shrink-0">
          <img
            src={item.coverUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      {!item.coverUrl && (
        <div className="w-12 h-12 shrink-0 bg-gray-400 dark:bg-gray-600 border border-gray-800 dark:border-gray-400" />
      )}
      <div className="flex-1">
        <div className="flex-1 flex gap-2">
          <div className="text-black dark:text-white font-medium">
            {item.name}
          </div>
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            {item.description}
          </div>
        </div>
        {item.audioUrl && (
          // <WaveformWithPlayhead
          //   height={12}
          //   colorPalette={{
          //     background: "#1a1a1a",
          //     lowFrequency: "#E74C3C",
          //     midFrequency: "#3498DB",
          //     highFrequency: "#2ECC71",
          //     centerLine: "#ECF0F1",
          //   }}
          //   url={item.audioUrl}
          // />
          <WaveformWithPlayhead allItems={allItems} url={item.audioUrl} />
        )}
      </div>
    </div>
  );
}

export const DualViewList = forwardRef<DualViewListHandle, DualViewListProps>(
  function DualViewList({ className = "" }, ref) {
    const { audioItems } = useAudioItems();
    const [showCoverflow, _setShowCoverflow] = useState(false);
    const [cursorIndex, setCursorIndex] = useState(INITIAL_CURSOR_INDEX);
    const tableVirtualizerRef = useRef<TableVirtualizerHandle>(null);
    const coverFlowRef = useRef<CoverFlowRef>(null);
    const prevShowCoverflowRef = useRef(showCoverflow);
    const isPanelFocused = useIsPanelFocused("center");

    // Transform audioItems to DualViewListItem format
    const items = useMemo<DualViewListItem[]>(() => {
      return audioItems.map((item, index) => ({
        id: index + 1,
        title: item.title,
        name: item.title,
        description: undefined,
        coverUrl: item.coverUrl,
        audioUrl: item.audioUrl, // Already full URL
      }));
    }, [audioItems]);

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
    const coverFlowItems = useMemo(
      () =>
        items.map((item) => ({
          id: `${item.id}`,
          title: item.title || item.name || `Item ${item.id}`,
          imgSrc: item.coverUrl,
        })),
      [items]
    );

    return (
      <div className={`grow flex flex-col gap-4 ${className}`}>
        {/* Toggle button */}

        {/* CoverFlow on top */}
        {showCoverflow && (
          <div style={{ height: COVERFLOW_HEIGHT }}>
            <CoverFlowV2
              // ref={coverFlowRef}
              items={coverFlowItems}
              // onFocussedItem={handleFocussedItem}
            />
          </div>
        )}

        {/* TableVirtualizer below */}
        <TableVirtualizer
          ref={tableVirtualizerRef}
          items={items}
          itemHeight={ITEM_HEIGHT}
          overscan={OVERSCAN}
          renderItem={(item, index) => (
            <RenderItemComponent
              item={item}
              index={index}
              allItems={items}
              isSelected={index === cursorIndex}
              isPanelFocused={isPanelFocused}
            />
          )}
        />
      </div>
    );
  }
);
