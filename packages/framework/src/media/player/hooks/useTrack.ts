import { useEffect, useCallback } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { usePlayerContext } from "../context/PlayerContext";
import {
  activeUrlAtom,
  queueAtom,
  currentQueueIndexAtom,
  playheadPositionAtomFamily,
  type QueueItem,
} from "../Player";
import { normalizeUrl } from "../utils/urlUtils";
import {
  ensureAudioSource,
  waitForMetadataAndReady,
  performSeekAndPlay,
} from "../utils/audioPlaybackUtils";
import { buildQueueFromTrack } from "../utils/queueUtils";

interface UseTrackReturn {
  playheadPosition: number | null;
  seekAndPlay: (position: number) => void;
  play: () => void;
  pause: () => void;
}

export const useTrack = (
  url: string,
  allItems?: QueueItem[]
): UseTrackReturn => {
  const { audioRef, setSrc } = usePlayerContext();
  const [activeUrl, setActiveUrl] = useAtom(activeUrlAtom);
  const setQueue = useSetAtom(queueAtom);
  const setCurrentQueueIndex = useSetAtom(currentQueueIndexAtom);
  const playheadPosition = useAtomValue(playheadPositionAtomFamily(url));
  const setPlayheadPosition = useSetAtom(playheadPositionAtomFamily(url));

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const normalizedUrl = normalizeUrl(url);

    const updatePlayhead = () => {
      const currentSrc = audio.src;
      const normalizedCurrentSrc = normalizeUrl(currentSrc);
      const isThisUrlActive = activeUrl === url;
      const isAudioSourceThisUrl = normalizedCurrentSrc === normalizedUrl;

      if (isThisUrlActive && isAudioSourceThisUrl) {
        if (audio.duration && !isNaN(audio.duration)) {
          setPlayheadPosition(audio.currentTime / audio.duration);
        } else {
          setPlayheadPosition(null);
        }
      }
    };

    audio.addEventListener("timeupdate", updatePlayhead);
    audio.addEventListener("loadedmetadata", updatePlayhead);
    audio.addEventListener("loadeddata", updatePlayhead);

    if (activeUrl !== url) {
      setPlayheadPosition(null);
    }

    return () => {
      audio.removeEventListener("timeupdate", updatePlayhead);
      audio.removeEventListener("loadedmetadata", updatePlayhead);
      audio.removeEventListener("loadeddata", updatePlayhead);
    };
  }, [url, audioRef, activeUrl, setPlayheadPosition]);

  const seekAndPlay = useCallback(
    (position: number) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (allItems && allItems.length > 0) {
        const queueItems = buildQueueFromTrack(allItems, url);
        if (queueItems) {
          setQueue(queueItems);
          setCurrentQueueIndex(0);
        }
      }

      setActiveUrl(url);
      ensureAudioSource(audio, url, setSrc);

      waitForMetadataAndReady(audio, () => {
        performSeekAndPlay(audio, position).catch(console.error);
      });
    },
    [audioRef, url, setActiveUrl, allItems, setQueue, setCurrentQueueIndex, setSrc]
  );

  const play = useCallback(() => {
    if (allItems && allItems.length > 0) {
      const queueItems = buildQueueFromTrack(allItems, url);
      if (queueItems) {
        setQueue(queueItems);
        setCurrentQueueIndex(0);
      }
    }

    setActiveUrl(url);
    audioRef.current?.play();
  }, [audioRef, url, setActiveUrl, allItems, setQueue, setCurrentQueueIndex]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, [audioRef]);

  return {
    playheadPosition,
    seekAndPlay,
    play,
    pause,
  };
};

