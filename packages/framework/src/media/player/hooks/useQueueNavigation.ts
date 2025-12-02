import { useCallback } from "react";
import type React from "react";
import { useAtom, useSetAtom } from "jotai";
import { queueAtom, currentQueueIndexAtom, activeUrlAtom } from "../Player";

/**
 * Hook for queue navigation (next/previous track)
 */
export const useQueueNavigation = () => {
  const [queue] = useAtom(queueAtom);
  const [currentQueueIndex, setCurrentQueueIndex] = useAtom(currentQueueIndexAtom);
  const setActiveUrl = useSetAtom(activeUrlAtom);

  const playTrackByIndex = useCallback(
    (index: number, audioRef: React.RefObject<HTMLAudioElement | null>) => {
      const audio = audioRef.current;
      if (!audio || index < 0 || index >= queue.length) return;

      const item = queue[index];
      if (item) {
        setCurrentQueueIndex(index);
        setActiveUrl(item.audioUrl);
        audio.src = item.audioUrl;
        audio.load();
        audio.play().catch(console.error);
      }
    },
    [queue, setCurrentQueueIndex, setActiveUrl]
  );

  const goToNext = useCallback(
    (audioRef: React.RefObject<HTMLAudioElement | null>) => {
      if (currentQueueIndex >= 0 && currentQueueIndex < queue.length - 1) {
        playTrackByIndex(currentQueueIndex + 1, audioRef);
      }
    },
    [currentQueueIndex, queue.length, playTrackByIndex]
  );

  const goToPrevious = useCallback(
    (audioRef: React.RefObject<HTMLAudioElement | null>) => {
      if (currentQueueIndex > 0) {
        playTrackByIndex(currentQueueIndex - 1, audioRef);
      }
    },
    [currentQueueIndex, playTrackByIndex]
  );

  return {
    playTrackByIndex,
    goToNext,
    goToPrevious,
  };
};

