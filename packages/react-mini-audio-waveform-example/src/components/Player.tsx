import React, {
  createContext,
  useContext,
  useRef,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { atomFamily } from "jotai/utils";

interface PlayerContextValue {
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export const usePlayerContext = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayerContext must be used within a Player component");
  }
  return context;
};

// Atom for tracking the currently active URL
export const activeUrlAtom = atom<string | null>(null);

// Atom family for playhead position per URL
const playheadPositionAtomFamily = atomFamily((url: string) =>
  atom<number | null>(null)
);

// Queue state atoms
export interface QueueItem {
  title: string;
  audioUrl: string;
}

export const queueAtom = atom<QueueItem[]>([]);
export const currentQueueIndexAtom = atom<number>(-1);

interface PlayerProps {
  children: ReactNode;
}

export const Player: React.FC<PlayerProps> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [queue] = useAtom(queueAtom);
  const [currentQueueIndex, setCurrentQueueIndex] = useAtom(
    currentQueueIndexAtom
  );
  const [activeUrl, setActiveUrl] = useAtom(activeUrlAtom);

  // Handle track ending and advance to next in queue
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (currentQueueIndex >= 0 && currentQueueIndex < queue.length - 1) {
        // Advance to next track in queue
        const nextIndex = currentQueueIndex + 1;
        const nextItem = queue[nextIndex];
        if (nextItem) {
          setCurrentQueueIndex(nextIndex);
          // audioUrl should already be a full URL
          const fullUrl = nextItem.audioUrl;
          setActiveUrl(fullUrl);
          audio.src = fullUrl;
          audio.load();
          audio.play().catch(console.error);
        }
      } else {
        // Queue finished or no queue
        setCurrentQueueIndex(-1);
      }
    };

    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("ended", handleEnded);
    };
  }, [queue, currentQueueIndex, setCurrentQueueIndex, setActiveUrl]);

  return (
    <PlayerContext.Provider value={{ audioRef }}>
      <audio ref={audioRef} crossOrigin="anonymous" />
      {children}
    </PlayerContext.Provider>
  );
};

interface UseTrackReturn {
  playheadPosition: number | null;
  seekAndPlay: (position: number) => void;
  play: () => void;
  pause: () => void;
}

// Helper function to normalize URLs for comparison (remove query params)
const normalizeUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.origin + urlObj.pathname;
  } catch {
    // If URL parsing fails, try to remove query string manually
    return url.split("?")[0];
  }
};

export const useTrack = (url: string): UseTrackReturn => {
  const { audioRef } = usePlayerContext();
  const [activeUrl, setActiveUrl] = useAtom(activeUrlAtom);
  const playheadPosition = useAtomValue(playheadPositionAtomFamily(url));
  const setPlayheadPosition = useSetAtom(playheadPositionAtomFamily(url));

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const normalizedUrl = normalizeUrl(url);

    // Update playhead position for this URL only when it's active
    const updatePlayhead = () => {
      // Only update if this URL is currently active and matches the audio source
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

    // Listen to time updates
    audio.addEventListener("timeupdate", updatePlayhead);
    audio.addEventListener("loadedmetadata", updatePlayhead);
    audio.addEventListener("loadeddata", updatePlayhead);

    // Reset playhead when URL changes
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
      console.log("seekAndPlay called with percentage:", position);

      const audio = audioRef.current;
      if (!audio) return;

      // Set this URL as active
      setActiveUrl(url);

      const normalizedUrl = normalizeUrl(url);
      const currentSrc = audio.src;
      const normalizedCurrentSrc = normalizeUrl(currentSrc);

      // Ensure the correct audio file is loaded
      if (normalizedCurrentSrc !== normalizedUrl) {
        audio.src = url;
        audio.load();
      }

      // Wait for metadata to be available
      const performSeek = () => {
        if (!audio.duration || isNaN(audio.duration)) {
          audio.addEventListener("loadedmetadata", performSeek, { once: true });
          return;
        }

        const clampedPosition = Math.max(0, Math.min(1, position));
        const seekTime = clampedPosition * audio.duration;

        console.log(
          `Seeking to ${clampedPosition * 100}% (${seekTime.toFixed(
            2
          )}s of ${audio.duration.toFixed(2)}s)`
        );

        // audio.load();
        audio.currentTime = seekTime;
        audio.play().catch(console.error);
        console.log("target:", seekTime, "actual:", audio.currentTime);
        // setInterval(() => {
        //   console.log("target:", seekTime, "actual:", audio.currentTime);
        // }, 1000);
      };

      performSeek();
    },
    [audioRef, url, setActiveUrl]
  );

  const play = useCallback(() => {
    setActiveUrl(url);
    audioRef.current?.play();
  }, [audioRef, url, setActiveUrl]);

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
