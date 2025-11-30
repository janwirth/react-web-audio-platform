import { useSetAtom, useAtom } from "jotai";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  queueAtom,
  currentQueueIndexAtom,
  activeUrlAtom,
  type QueueItem,
} from "./Player";
import { usePlayerContext } from "./Player";
import { TableVirtualizer, TableVirtualizerHandle } from "../TableVirtualizer";
import { usePanelEvent, useIsPanelFocused } from "../../hooks/usePanelEvent";
import { WaveformWithPlayhead } from "../waveform/WaveformWithPlayhead";

export function useQueue() {
  const setQueue = useSetAtom(queueAtom);
  const setCurrentQueueIndex = useSetAtom(currentQueueIndexAtom);

  const initQueue = (items: QueueItem[]) => {
    setQueue(items);
    setCurrentQueueIndex(items.length > 0 ? 0 : -1);
  };

  return { initQueue };
}

const ITEM_HEIGHT = 80;
const OVERSCAN = 3;

export function Queue() {
  const [queue, setQueue] = useAtom(queueAtom);
  const [currentIndex, setCurrentQueueIndex] = useAtom(currentQueueIndexAtom);
  const setActiveUrl = useSetAtom(activeUrlAtom);
  const { audioRef } = usePlayerContext();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const tableVirtualizerRef = useRef<TableVirtualizerHandle>(null);

  // Sync selectedIndex to currentIndex when queue changes or currentIndex changes
  useEffect(() => {
    if (currentIndex >= 0 && currentIndex < queue.length) {
      setSelectedIndex(currentIndex);
      // Scroll to current item
      setTimeout(() => {
        tableVirtualizerRef.current?.scrollToIndexIfNeeded(currentIndex);
      }, 0);
    } else if (queue.length > 0 && selectedIndex >= queue.length) {
      setSelectedIndex(Math.max(0, queue.length - 1));
    } else if (queue.length === 0) {
      setSelectedIndex(0);
    }
  }, [currentIndex, queue.length]);

  // Handle keyboard navigation via panel events
  usePanelEvent("rightSidebar", {
    arrowUp: useCallback(() => {
      setSelectedIndex((prev) => {
        const newIndex = Math.max(0, prev - 1);
        setTimeout(() => {
          tableVirtualizerRef.current?.scrollToIndexIfNeeded(newIndex);
        }, 0);
        return newIndex;
      });
    }, []),
    arrowDown: useCallback(() => {
      setSelectedIndex((prev) => {
        const newIndex = Math.min(queue.length - 1, prev + 1);
        setTimeout(() => {
          tableVirtualizerRef.current?.scrollToIndexIfNeeded(newIndex);
        }, 0);
        return newIndex;
      });
    }, [queue.length]),
    enter: useCallback(() => {
      tableVirtualizerRef.current?.triggerEnter?.();
    }, []),
  });

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newQueue = [...queue];
    const [draggedItem] = newQueue.splice(draggedIndex, 1);
    newQueue.splice(dropIndex, 0, draggedItem);

    // Update the current index if the currently playing item was moved
    let newCurrentIndex = currentIndex;
    if (draggedIndex === currentIndex) {
      // The currently playing item was moved
      newCurrentIndex = dropIndex;
    } else if (draggedIndex < currentIndex && dropIndex >= currentIndex) {
      // An item before the current one was moved after it
      newCurrentIndex = currentIndex - 1;
    } else if (draggedIndex > currentIndex && dropIndex <= currentIndex) {
      // An item after the current one was moved before it
      newCurrentIndex = currentIndex + 1;
    }

    setQueue(newQueue);
    setCurrentQueueIndex(newCurrentIndex);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleClick = (index: number) => {
    setSelectedIndex(index);
    playItemAtIndex(index);
  };

  const playItemAtIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < queue.length && audioRef.current) {
        const item = queue[index];
        const audioUrl = item?.audioUrl;
        if (audioUrl) {
          setCurrentQueueIndex(index);
          setActiveUrl(audioUrl);
          audioRef.current.src = audioUrl;
          audioRef.current.load();
          audioRef.current.play().catch(console.error);
        }
      }
    },
    [queue, audioRef, setCurrentQueueIndex, setActiveUrl]
  );

  const handleEnter = useCallback(
    (_item: QueueItem, index: number) => {
      playItemAtIndex(index);
    },
    [playItemAtIndex]
  );

  const isPanelFocused = useIsPanelFocused("rightSidebar");

  const renderItem = useCallback(
    (item: QueueItem, index: number) => {
      let opacity = 1;
      if (draggedIndex === index) {
        opacity = 0.5;
      } else if (dragOverIndex === index && draggedIndex !== null) {
        opacity = 0.7;
      } else if (index === currentIndex) {
        opacity = 1;
      } else if (index === selectedIndex) {
        opacity = 0.9;
      } else {
        opacity = 0.6;
      }

      const isSelected = index === selectedIndex;
      const isCurrent = index === currentIndex;

      return (
        <div
          draggable
          onClick={() => handleClick(index)}
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className="cursor-pointer select-none py-1 px-2 rounded transition-opacity font-mono text-xs relative flex flex-col gap-1"
          style={{
            opacity,
            backgroundColor:
              isSelected || isCurrent
                ? "rgba(128, 128, 128, 0.15)"
                : "transparent",
          }}
        >
          <div className="flex items-center gap-2">
            {isSelected && isPanelFocused && (
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            )}
            <span>
              {index + 1}. {item.title}
            </span>
          </div>
          {isCurrent && item.audioUrl && (
            <div className="w-full">
              <WaveformWithPlayhead
                url={item.audioUrl}
                height={32}
                allItems={queue}
              />
            </div>
          )}
        </div>
      );
    },
    [
      draggedIndex,
      dragOverIndex,
      currentIndex,
      selectedIndex,
      isPanelFocused,
      queue,
      handleClick,
      handleDragStart,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      handleDragEnd,
    ]
  );

  return (
    <div className="text-xs font-mono flex flex-col h-full w-full">
      {queue.length === 0 ? (
        <div className="text-gray-400 dark:text-gray-700">empty.</div>
      ) : (
        <TableVirtualizer
          ref={tableVirtualizerRef}
          items={queue}
          itemHeight={ITEM_HEIGHT}
          overscan={OVERSCAN}
          renderItem={renderItem}
          onEnter={handleEnter}
          selectedIndex={selectedIndex}
          className="flex-1 min-h-0"
        />
      )}
    </div>
  );
}
