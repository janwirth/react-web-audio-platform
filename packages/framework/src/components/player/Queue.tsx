import { useSetAtom, useAtom } from "jotai";
import { useState } from "react";
import {
  queueAtom,
  currentQueueIndexAtom,
  activeUrlAtom,
  type QueueItem,
} from "./Player";
import { usePlayerContext } from "./Player";

export function useQueue() {
  const setQueue = useSetAtom(queueAtom);
  const setCurrentQueueIndex = useSetAtom(currentQueueIndexAtom);

  const initQueue = (items: QueueItem[]) => {
    setQueue(items);
    setCurrentQueueIndex(items.length > 0 ? 0 : -1);
  };

  return { initQueue };
}

export function Queue() {
  const [queue, setQueue] = useAtom(queueAtom);
  const [currentIndex, setCurrentQueueIndex] = useAtom(currentQueueIndexAtom);
  const setActiveUrl = useSetAtom(activeUrlAtom);
  const { audioRef } = usePlayerContext();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleNext = () => {
    if (currentIndex < queue.length - 1) {
      const nextIndex = currentIndex + 1;
      const nextItem = queue[nextIndex];
      if (nextItem && audioRef.current) {
        setCurrentQueueIndex(nextIndex);
        setActiveUrl(nextItem.audioUrl);
        audioRef.current.src = nextItem.audioUrl;
        audioRef.current.load();
        audioRef.current.play().catch(console.error);
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      const prevItem = queue[prevIndex];
      if (prevItem && audioRef.current) {
        setCurrentQueueIndex(prevIndex);
        setActiveUrl(prevItem.audioUrl);
        audioRef.current.src = prevItem.audioUrl;
        audioRef.current.load();
        audioRef.current.play().catch(console.error);
      }
    }
  };

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
    if (index !== currentIndex && queue[index] && audioRef.current) {
      const item = queue[index];
      setCurrentQueueIndex(index);
      setActiveUrl(item.audioUrl);
      audioRef.current.src = item.audioUrl;
      audioRef.current.load();
      audioRef.current.play().catch(console.error);
    }
  };

  const canGoNext = currentIndex < queue.length - 1;
  const canGoPrev = currentIndex > 0;

  return (
    <div className="text-xs font-mono">
      <div className="flex items-center justify-between mb-2">
        <div>Queue ({queue.length})</div>
        {queue.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              disabled={!canGoPrev}
              style={{ opacity: canGoPrev ? 1 : 0.5 }}
            >
              ← Prev
            </button>
            <button
              onClick={handleNext}
              disabled={!canGoNext}
              style={{ opacity: canGoNext ? 1 : 0.5 }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
      {queue.length === 0 ? (
        <div className="text-gray-400 dark:text-gray-700">empty.</div>
      ) : (
        <div>
          {queue.map((item, index) => {
            let opacity = 1;
            if (draggedIndex === index) {
              opacity = 0.5;
            } else if (dragOverIndex === index && draggedIndex !== null) {
              opacity = 0.7;
            } else if (index === currentIndex) {
              opacity = 1;
            } else {
              opacity = 0.6;
            }

            return (
              <div
                key={`${item.audioUrl}-${index}`}
                draggable
                onClick={() => handleClick(index)}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className="cursor-pointer select-none py-1 px-2 rounded transition-opacity"
                style={{ opacity }}
              >
                {index + 1}. {item.title}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
