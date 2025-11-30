import {
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useMemo,
} from "react";
import { TableVirtualizer, TableVirtualizerHandle } from "./TableVirtualizer";
import { WaveformWithPlayhead } from "./waveform";
import { QueueItem, usePlayer } from "./player/Player";
import { usePanelEvent } from "@/hooks/usePanelEvent";
import { useAtomValue } from "jotai";
import { tracksAtom } from "@/hooks/useData";

export interface TracklistItem {
  id: string | number;
  coverUrl: string | null;
  title?: string;
  name?: string;
  description?: string;
  audioUrl?: string;
  [key: string]: any;
}

export interface TracklistProps {
  className?: string;
}

export interface TracklistHandle {
  moveUp: () => void;
  moveDown: () => void;
  getCursorIndex: () => number;
  setCursorIndex: (index: number) => void;
}

// Settings
const ITEM_HEIGHT = 64;
const OVERSCAN = 5;
const INITIAL_CURSOR_INDEX = 0;

// Render item function
function TrackItemRenderer({
  item,
  index: _index,
  allItems,
  isSelected,
}: {
  item: TracklistItem;
  index: number;
  allItems: QueueItem[];
  isSelected: boolean;
}) {
  return (
    <div
      className="dark:border-gray-800 hover:opacity-60 transition-opacity font-mono text-sm relative flex items-center gap-2"
      style={{
        backgroundColor: isSelected
          ? "rgba(128, 128, 128, 0.15)"
          : "transparent",
      }}
    >
      {isSelected && (
        <div
          className="w-1.5 h-1.5 rounded-full absolute -left-2"
          style={{
            backgroundColor: "currentColor",
          }}
        />
      )}
      <div className="p-1 text-xs text-gray-500 dark:text-gray-400">
        {_index}
      </div>
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
          <WaveformWithPlayhead allItems={allItems} url={item.audioUrl} />
        )}
      </div>
    </div>
  );
}

export const Tracklist = forwardRef<TracklistHandle, TracklistProps>(
  function Tracklist({ className = "" }, ref) {
    const tracks = useAtomValue(tracksAtom);
    const [cursorIndex, setCursorIndex] = useState(INITIAL_CURSOR_INDEX);
    const tableVirtualizerRef = useRef<TableVirtualizerHandle>(null);

    // Transform tracks to TracklistItem format
    const items = useMemo<TracklistItem[]>(() => {
      return tracks.map((track) => ({
        id: track.id,
        title: track.title,
        name: track.title,
        description: undefined,
        coverUrl: track.coverUrl,
        audioUrl: track.audioUrl,
      }));
    }, [tracks]);

    // Move cursor up
    const moveUp = useCallback(() => {
      setCursorIndex((prev) => {
        const newIndex = Math.max(0, prev - 1);
        setTimeout(() => {
          tableVirtualizerRef.current?.scrollToIndexIfNeeded(newIndex);
        }, 0);
        return newIndex;
      });
    }, []);

    // Move cursor down
    const moveDown = useCallback(() => {
      setCursorIndex((prev) => {
        const newIndex = Math.min(items.length - 1, prev + 1);
        setTimeout(() => {
          tableVirtualizerRef.current?.scrollToIndexIfNeeded(newIndex);
        }, 0);
        return newIndex;
      });
    }, [items.length]);
    usePanelEvent("center", {
      arrowUp: useCallback(() => {
        moveUp();
      }, [moveUp]),
      arrowDown: useCallback(() => {
        moveDown();
      }, [moveDown]),
      enter: useCallback(() => {
        tableVirtualizerRef.current?.triggerEnter?.();
      }, []),
    });

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
          setTimeout(() => {
            tableVirtualizerRef.current?.scrollToIndexIfNeeded(clampedIndex);
          }, 0);
        },
      }),
      [moveUp, moveDown, cursorIndex, items.length]
    );
    const { play } = usePlayer();

    const handleEnter = useCallback(
      (item: TracklistItem, _index: number) => {
        play(item, items);
      },
      [play, items]
    );

    return (
      <div className={`grow flex flex-col ${className}`}>
        <TableVirtualizer
          ref={tableVirtualizerRef}
          items={items}
          itemHeight={ITEM_HEIGHT}
          overscan={OVERSCAN}
          renderItem={(item, index) => (
            <TrackItemRenderer
              item={item}
              index={index}
              allItems={items}
              isSelected={index === cursorIndex}
            />
          )}
          onEnter={handleEnter}
          selectedIndex={cursorIndex}
        />
      </div>
    );
  }
);
