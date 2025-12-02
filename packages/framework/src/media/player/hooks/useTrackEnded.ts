import { useEffect } from "react";
import { useAtom } from "jotai";
import { usePlayerContext } from "../context/PlayerContext";
import { queueAtom, currentQueueIndexAtom } from "../Player";
import { useQueueNavigation } from "./useQueueNavigation";

/**
 * Hook to handle track ending and advance to next in queue
 */
export const useTrackEnded = () => {
  const { audioRef } = usePlayerContext();
  const [queue] = useAtom(queueAtom);
  const [currentQueueIndex, setCurrentQueueIndex] = useAtom(
    currentQueueIndexAtom
  );
  const { goToNext } = useQueueNavigation();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (currentQueueIndex >= 0 && currentQueueIndex < queue.length - 1) {
        goToNext(audioRef);
      } else {
        setCurrentQueueIndex(-1);
      }
    };

    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("ended", handleEnded);
    };
  }, [queue, currentQueueIndex, setCurrentQueueIndex, goToNext, audioRef]);
};

