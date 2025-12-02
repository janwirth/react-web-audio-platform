import { useEffect } from "react";
import { useAtom } from "jotai";
import { usePlayerContext } from "../context/PlayerContext";
import {
  queueAtom,
  currentQueueIndexAtom,
  activeUrlAtom,
} from "../Player";
import { useQueueNavigation } from "./useQueueNavigation";

/**
 * Hook to handle auto-playing tracks when queue index changes
 */
export const useQueueAutoPlay = () => {
  const { audioRef } = usePlayerContext();
  const [queue] = useAtom(queueAtom);
  const [currentQueueIndex] = useAtom(currentQueueIndexAtom);
  const [activeUrl] = useAtom(activeUrlAtom);
  const { playTrackByIndex } = useQueueNavigation();

  useEffect(() => {
    if (currentQueueIndex >= 0 && currentQueueIndex < queue.length) {
      const item = queue[currentQueueIndex];
      if (item && item.audioUrl !== activeUrl) {
        playTrackByIndex(currentQueueIndex, audioRef);
      }
    }
  }, [currentQueueIndex, queue, activeUrl, playTrackByIndex]);
};

