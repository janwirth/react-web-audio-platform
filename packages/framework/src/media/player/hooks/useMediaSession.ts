import { useEffect } from "react";
import type React from "react";
import type { QueueItem } from "../Player";

interface UseMediaSessionOptions {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  currentItem: QueueItem | null;
  activeUrl: string | null;
  onPlay: () => void;
  onPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

/**
 * Hook to manage Media Session API for device controls
 */
export const useMediaSession = ({
  audioRef,
  currentItem,
  activeUrl,
  onPlay,
  onPause,
  onPrevious,
  onNext,
}: UseMediaSessionOptions): void => {
  // Set up action handlers
  useEffect(() => {
    if (!("mediaSession" in navigator)) {
      return;
    }

    const mediaSession = navigator.mediaSession;

    mediaSession.setActionHandler("play", onPlay);
    mediaSession.setActionHandler("pause", onPause);
    mediaSession.setActionHandler("previoustrack", onPrevious);
    mediaSession.setActionHandler("nexttrack", onNext);

    return () => {
      try {
        mediaSession.setActionHandler("play", null);
        mediaSession.setActionHandler("pause", null);
        mediaSession.setActionHandler("previoustrack", null);
        mediaSession.setActionHandler("nexttrack", null);
      } catch {
        // Ignore errors during cleanup
      }
    };
  }, [onPlay, onPause, onPrevious, onNext]);

  // Update metadata when active track changes
  useEffect(() => {
    if (!("mediaSession" in navigator)) {
      return;
    }

    const mediaSession = navigator.mediaSession;

    if (currentItem && activeUrl) {
      mediaSession.metadata = new MediaMetadata({
        title: currentItem.title,
        artist: "Audio Player",
      });

      const audio = audioRef.current;
      if (audio) {
        mediaSession.playbackState = audio.paused ? "paused" : "playing";
      }
    } else {
      mediaSession.metadata = null;
    }
  }, [activeUrl, currentItem, audioRef]);

  // Update playback state and position
  useEffect(() => {
    if (!("mediaSession" in navigator)) {
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    const updatePlaybackState = () => {
      navigator.mediaSession.playbackState = audio.paused
        ? "paused"
        : "playing";
    };

    const updatePositionState = () => {
      if (audio.duration && isFinite(audio.duration)) {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          playbackRate: audio.playbackRate,
          position: audio.currentTime,
        });
      }
    };

    const intervalId = setInterval(() => {
      if (!audio.paused && audio.duration && isFinite(audio.duration)) {
        updatePositionState();
      }
    }, 1000);

    audio.addEventListener("play", updatePlaybackState);
    audio.addEventListener("pause", updatePlaybackState);
    audio.addEventListener("ended", updatePlaybackState);
    audio.addEventListener("timeupdate", updatePositionState);
    audio.addEventListener("loadedmetadata", updatePositionState);

    updatePlaybackState();
    updatePositionState();

    return () => {
      clearInterval(intervalId);
      audio.removeEventListener("play", updatePlaybackState);
      audio.removeEventListener("pause", updatePlaybackState);
      audio.removeEventListener("ended", updatePlaybackState);
      audio.removeEventListener("timeupdate", updatePositionState);
      audio.removeEventListener("loadedmetadata", updatePositionState);
    };
  }, [audioRef]);
};

