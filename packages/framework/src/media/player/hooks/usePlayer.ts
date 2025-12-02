import { useCallback } from "react";
import { useSetAtom } from "jotai";
import { usePlayerContext } from "../context/PlayerContext";
import {
  activeUrlAtom,
  queueAtom,
  currentQueueIndexAtom,
  type QueueItem,
} from "../Player";
import {
  ensureAudioSource,
  waitForMetadataAndReady,
  performPlayFromStart,
} from "../utils/audioPlaybackUtils";
import { buildQueueFromTrack } from "../utils/queueUtils";

export const usePlayer = () => {
  const { audioRef, setSrc } = usePlayerContext();
  const setActiveUrl = useSetAtom(activeUrlAtom);
  const setQueue = useSetAtom(queueAtom);
  const setCurrentQueueIndex = useSetAtom(currentQueueIndexAtom);

  const play = useCallback(
    (item: QueueItem, allTracks?: QueueItem[]) => {
      const audio = audioRef.current;
      if (!audio || !item.audioUrl) return;

      if (allTracks && allTracks.length > 0) {
        const queueItems = buildQueueFromTrack(allTracks, item.audioUrl);
        if (queueItems) {
          setQueue(queueItems);
          setCurrentQueueIndex(0);
        }
      }

      setActiveUrl(item.audioUrl);
      ensureAudioSource(audio, item.audioUrl, setSrc);

      waitForMetadataAndReady(audio, () => {
        performPlayFromStart(audio);
      });
    },
    [audioRef, setActiveUrl, setQueue, setCurrentQueueIndex, setSrc]
  );

  return {
    play,
  };
};
