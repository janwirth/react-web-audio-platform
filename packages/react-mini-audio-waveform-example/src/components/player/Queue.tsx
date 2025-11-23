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
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-4 mb-4 sticky top-[73px]">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300">
          Queue ({queue.length})
        </div>
        {queue.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              disabled={!canGoPrev}
              className={`px-3 py-1 text-xs font-mono rounded border ${
                canGoPrev
                  ? "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                  : "bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
              }`}
            >
              ← Prev
            </button>
            <button
              onClick={handleNext}
              disabled={!canGoNext}
              className={`px-3 py-1 text-xs font-mono rounded border ${
                canGoNext
                  ? "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                  : "bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
              }`}
            >
              Next →
            </button>
          </div>
        )}
      </div>
      {queue.length === 0 ? (
        <div className="text-xs font-mono text-gray-500 dark:text-gray-400 italic">
          Queue is empty. Click on any track title to create a queue starting
          from that track.
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {queue.map((item, index) => (
            <div
              key={`${item.audioUrl}-${index}`}
              className={`text-xs font-mono px-2 py-1 rounded ${
                index === currentIndex
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-bold"
                  : index < currentIndex
                  ? "text-gray-400 dark:text-gray-600 line-through"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              {index + 1}. {item.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
