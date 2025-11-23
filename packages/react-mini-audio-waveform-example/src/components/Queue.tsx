import { useAtomValue, useSetAtom, useAtom } from "jotai";
import { queueAtom, currentQueueIndexAtom, activeUrlAtom, type QueueItem } from "./Player";
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

  if (queue.length === 0) {
    return null;
  }

  const canGoNext = currentIndex < queue.length - 1;
  const canGoPrev = currentIndex > 0;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-mono font-bold text-gray-700">
          Queue ({queue.length})
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrev}
            disabled={!canGoPrev}
            className={`px-3 py-1 text-xs font-mono rounded border ${
              canGoPrev
                ? "bg-white border-gray-300 hover:bg-gray-100 text-gray-700"
                : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            ← Prev
          </button>
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className={`px-3 py-1 text-xs font-mono rounded border ${
              canGoNext
                ? "bg-white border-gray-300 hover:bg-gray-100 text-gray-700"
                : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Next →
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {queue.map((item, index) => (
          <div
            key={`${item.audioUrl}-${index}`}
            className={`text-xs font-mono px-2 py-1 rounded ${
              index === currentIndex
                ? "bg-blue-100 text-blue-900 font-bold"
                : index < currentIndex
                ? "text-gray-400 line-through"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {index + 1}. {item.title}
          </div>
        ))}
      </div>
    </div>
  );
}
