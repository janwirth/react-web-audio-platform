import { useState, useEffect } from "react";

/**
 * Hook to track playing state from audio element
 */
export const usePlaybackState = (
  audioRef: React.RefObject<HTMLAudioElement | null>
): boolean => {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updatePlayingState = () => {
      setPlaying(!audio.paused);
    };

    updatePlayingState();

    audio.addEventListener("play", updatePlayingState);
    audio.addEventListener("pause", updatePlayingState);
    audio.addEventListener("ended", updatePlayingState);

    return () => {
      audio.removeEventListener("play", updatePlayingState);
      audio.removeEventListener("pause", updatePlayingState);
      audio.removeEventListener("ended", updatePlayingState);
    };
  }, [audioRef]);

  return playing;
};

