import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

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

export const useTrack = (url: string): UseTrackReturn => {
  const { audioRef } = usePlayerContext();
  const [playheadPosition, setPlayheadPosition] = useState<number | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Set the audio source
    audio.src = url;
    audio.load();

    // Update playhead position
    const updatePlayhead = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setPlayheadPosition(audio.currentTime / audio.duration);
      } else {
        setPlayheadPosition(null);
      }
    };

    // Listen to time updates
    audio.addEventListener("timeupdate", updatePlayhead);
    audio.addEventListener("loadedmetadata", updatePlayhead);
    audio.addEventListener("loadeddata", updatePlayhead);

    // Reset playhead when source changes
    setPlayheadPosition(null);

    return () => {
      audio.removeEventListener("timeupdate", updatePlayhead);
      audio.removeEventListener("loadedmetadata", updatePlayhead);
      audio.removeEventListener("loadeddata", updatePlayhead);
    };
  }, [url, audioRef]);

  const seekAndPlay = useCallback(
    (position: number) => {
      const audio = audioRef.current;
      if (!audio) return;

      // Ensure the correct audio file is loaded before seeking
      if (audio.src !== url) {
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
    [audioRef, url]
  );

  const play = useCallback(() => {
    audioRef.current?.play();
  }, [audioRef]);

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
