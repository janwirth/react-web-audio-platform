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
const activeUrlAtom = atom<string | null>(null);

// Atom family for playhead position per URL
const playheadPositionAtomFamily = atomFamily((url: string) =>
  atom<number | null>(null)
);

interface PlayerProps {
  children: ReactNode;
}

export const Player: React.FC<PlayerProps> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  return (
    <PlayerContext.Provider value={{ audioRef }}>
      <audio controls ref={audioRef} />
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
      const audio = audioRef.current;
      if (!audio) return;

      // Set this URL as active
      setActiveUrl(url);

      const normalizedUrl = normalizeUrl(url);
      const currentSrc = audio.src;
      const normalizedCurrentSrc = normalizeUrl(currentSrc);

      // Ensure the correct audio file is loaded before seeking
      if (normalizedCurrentSrc !== normalizedUrl) {
        audio.src = url;
        audio.load();
        // Wait for metadata to be loaded before seeking
        audio.addEventListener(
          "loadedmetadata",
          () => {
            const clampedPosition = Math.max(0, Math.min(1, position));
            audio.currentTime = clampedPosition * audio.duration;
            audio.play();
          },
          { once: true }
        );
      } else {
        // Audio file is already loaded, seek immediately
        if (!audio.duration) return;
        const clampedPosition = Math.max(0, Math.min(1, position));
        audio.currentTime = clampedPosition * audio.duration;
        audio.play();
      }
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
