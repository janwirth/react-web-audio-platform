import { atom } from "jotai";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { useElement } from "@janwirth/react-web-audio-context";

// Track status type
export type TrackStatus = "idle" | "loading" | "playing" | "paused" | "error";

// Track state interface
interface TrackState {
  status: TrackStatus;
  playbackPosition: number; // in seconds
  duration: number; // in seconds
  error: string | null;
}

// Map to store atoms for each URL (jotai family pattern)
const trackStateAtomMap = new Map<
  string,
  ReturnType<typeof atom<TrackState>>
>();

// Get or create atom for a specific URL
const getTrackStateAtom = (url: string) => {
  if (!trackStateAtomMap.has(url)) {
    trackStateAtomMap.set(
      url,
      atom<TrackState>({
        status: "idle",
        playbackPosition: 0,
        duration: 0,
        error: null,
      })
    );
  }
  return trackStateAtomMap.get(url)!;
};

/**
 * Hook to manage audio track playback
 * @param url - The URL of the audio track
 * @returns Object with status, playbackPosition, and control functions
 */
export function useTrack(url: string | null) {
  const audioElement = useElement();
  const [trackState, setTrackState] = useAtom(
    url
      ? getTrackStateAtom(url)
      : atom<TrackState>({
          status: "idle",
          playbackPosition: 0,
          duration: 0,
          error: null,
        })
  );

  // Set audio source when URL changes
  useEffect(() => {
    if (!url) {
      audioElement.src = "";
      setTrackState({
        status: "idle",
        playbackPosition: 0,
        duration: 0,
        error: null,
      });
      return;
    }

    setTrackState((prev) => ({ ...prev, status: "loading", error: null }));
    audioElement.src = url;

    const handleLoadedMetadata = () => {
      setTrackState((prev) => ({
        ...prev,
        status: "idle",
        duration: audioElement.duration,
        error: null,
      }));
    };

    const handleError = () => {
      const errorMessage = audioElement.error
        ? `Audio error: ${audioElement.error.code}`
        : "Failed to load audio";
      setTrackState((prev) => ({
        ...prev,
        status: "error",
        error: errorMessage,
      }));
    };

    audioElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    audioElement.addEventListener("error", handleError);

    return () => {
      audioElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audioElement.removeEventListener("error", handleError);
    };
  }, [url, audioElement, setTrackState]);

  // Update playback position during playback
  useEffect(() => {
    const handleTimeUpdate = () => {
      if (trackState.status === "playing") {
        setTrackState((prev) => ({
          ...prev,
          playbackPosition: audioElement.currentTime,
        }));
      }
    };

    const handleEnded = () => {
      setTrackState((prev) => ({
        ...prev,
        status: "idle",
        playbackPosition: prev.duration,
      }));
    };

    audioElement.addEventListener("timeupdate", handleTimeUpdate);
    audioElement.addEventListener("ended", handleEnded);

    return () => {
      audioElement.removeEventListener("timeupdate", handleTimeUpdate);
      audioElement.removeEventListener("ended", handleEnded);
    };
  }, [trackState.status, audioElement, setTrackState]);

  // Play/pause control
  useEffect(() => {
    if (!url) return;

    if (trackState.status === "playing") {
      audioElement.play().catch((err) => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setTrackState((prev) => ({
          ...prev,
          status: "error",
          error: errorMessage,
        }));
      });
    } else if (trackState.status === "paused") {
      audioElement.pause();
    } else if (trackState.status === "idle") {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
  }, [trackState.status, url, audioElement, setTrackState]);

  // Control functions
  const play = () => {
    if (url && trackState.status !== "playing") {
      setTrackState((prev) => ({ ...prev, status: "playing" }));
    }
  };

  const pause = () => {
    if (trackState.status === "playing") {
      setTrackState((prev) => ({ ...prev, status: "paused" }));
    }
  };

  const stop = () => {
    setTrackState((prev) => ({
      ...prev,
      status: "idle",
      playbackPosition: 0,
    }));
  };

  const seek = (position: number) => {
    const duration = audioElement.duration || 0;
    const clampedPosition = Math.max(0, Math.min(position, duration));
    audioElement.currentTime = clampedPosition;
    setTrackState((prev) => ({
      ...prev,
      playbackPosition: clampedPosition,
    }));
  };

  return {
    status: trackState.status,
    playbackPosition: trackState.playbackPosition,
    duration: trackState.duration,
    error: trackState.error,
    play,
    pause,
    stop,
    seek,
  };
}
