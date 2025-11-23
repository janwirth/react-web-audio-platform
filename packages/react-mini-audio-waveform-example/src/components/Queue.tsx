import { useAtomValue } from "jotai";
import { queueAtom, currentQueueIndexAtom } from "./Player";

export function Queue() {
  const queue = useAtomValue(queueAtom);
  const currentIndex = useAtomValue(currentQueueIndexAtom);

  if (queue.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-4">
      <div className="text-xs font-mono font-bold text-gray-700 mb-2">
        Queue ({queue.length})
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

