import { useAtomValue, useSetAtom, useAtom } from "jotai";
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
  const queue = useAtomValue(queueAtom);
  const [currentIndex, setCurrentQueueIndex] = useAtom(currentQueueIndexAtom);
  const setActiveUrl = useSetAtom(activeUrlAtom);
  const { audioRef } = usePlayerContext();

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
        <div>
          Queue is empty. Click on any track title to create a queue starting
          from that track.
        </div>
      ) : (
        <div>
          {queue.map((item, index) => (
            <div key={`${item.audioUrl}-${index}`}>
              {index + 1}. {item.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
