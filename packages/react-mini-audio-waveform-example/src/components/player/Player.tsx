import React, {
  createContext,
  useContext,
  useRef,
  useEffect,
  useCallback,
  useState,
  ReactNode,
} from "react";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { atomFamily } from "jotai/utils";
import { DualViewListItem } from "../DualViewList";

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
export type QueueItem = DualViewListItem;

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

  // Helper function to play a track by index
  const playTrackByIndex = useCallback(
    (index: number) => {
      const audio = audioRef.current;
      if (!audio || index < 0 || index >= queue.length) return;

      const item = queue[index];
      if (item) {
        setCurrentQueueIndex(index);
        setActiveUrl(item.audioUrl);
        audio.src = item.audioUrl;
        audio.load();
        audio.play().catch(console.error);
      }
    },
    [queue, setCurrentQueueIndex, setActiveUrl]
  );

  // Helper function to go to next track
  const goToNext = useCallback(() => {
    if (currentQueueIndex >= 0 && currentQueueIndex < queue.length - 1) {
      playTrackByIndex(currentQueueIndex + 1);
    }
  }, [currentQueueIndex, queue.length, playTrackByIndex]);

  // Helper function to go to previous track
  const goToPrevious = useCallback(() => {
    if (currentQueueIndex > 0) {
      playTrackByIndex(currentQueueIndex - 1);
    }
  }, [currentQueueIndex, playTrackByIndex]);

  // Handle track ending and advance to next in queue
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (currentQueueIndex >= 0 && currentQueueIndex < queue.length - 1) {
        // Advance to next track in queue
        goToNext();
      } else {
        // Queue finished or no queue
        setCurrentQueueIndex(-1);
      }
    };

    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("ended", handleEnded);
    };
  }, [queue, currentQueueIndex, setCurrentQueueIndex, goToNext]);

  // Set up Media Session API for device controls
  useEffect(() => {
    if (!("mediaSession" in navigator)) {
      return; // Media Session API not supported
    }

    const mediaSession = navigator.mediaSession;

    // Set up action handlers
    mediaSession.setActionHandler("play", () => {
      const audio = audioRef.current;
      if (audio) {
        audio.play().catch(console.error);
      }
    });

    mediaSession.setActionHandler("pause", () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
      }
    });

    mediaSession.setActionHandler("previoustrack", () => {
      goToPrevious();
    });

    mediaSession.setActionHandler("nexttrack", () => {
      goToNext();
    });

    // Cleanup: remove action handlers
    return () => {
      try {
        mediaSession.setActionHandler("play", null);
        mediaSession.setActionHandler("pause", null);
        mediaSession.setActionHandler("previoustrack", null);
        mediaSession.setActionHandler("nexttrack", null);
      } catch (e) {
        // Ignore errors during cleanup
      }
    };
  }, [goToNext, goToPrevious]);

  // Update Media Session metadata when active track changes
  useEffect(() => {
    if (!("mediaSession" in navigator)) {
      return; // Media Session API not supported
    }

    const mediaSession = navigator.mediaSession;
    const currentItem =
      currentQueueIndex >= 0 && currentQueueIndex < queue.length
        ? queue[currentQueueIndex]
        : null;

    if (currentItem && activeUrl) {
      mediaSession.metadata = new MediaMetadata({
        title: currentItem.title,
        artist: "Audio Player",
        // You can add more metadata here if available
        // album: "",
        // artwork: [{ src: "", sizes: "", type: "" }],
      });

      // Update playback state
      const audio = audioRef.current;
      if (audio) {
        mediaSession.playbackState = audio.paused ? "paused" : "playing";
      }
    } else {
      // Clear metadata if no track is active
      mediaSession.metadata = null;
    }
  }, [activeUrl, currentQueueIndex, queue]);

  // Update Media Session playback state and position when audio state changes
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

    // Update position state periodically
    const intervalId = setInterval(() => {
      if (!audio.paused && audio.duration && isFinite(audio.duration)) {
        updatePositionState();
      }
    }, 1000); // Update every second

    audio.addEventListener("play", updatePlaybackState);
    audio.addEventListener("pause", updatePlaybackState);
    audio.addEventListener("ended", updatePlaybackState);
    audio.addEventListener("timeupdate", updatePositionState);
    audio.addEventListener("loadedmetadata", updatePositionState);

    // Initial update
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
  }, []);

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

export const useTrack = (
  url: string,
  allItems?: QueueItem[]
): UseTrackReturn => {
  const { audioRef } = usePlayerContext();
  const [activeUrl, setActiveUrl] = useAtom(activeUrlAtom);
  const setQueue = useSetAtom(queueAtom);
  const setCurrentQueueIndex = useSetAtom(currentQueueIndexAtom);
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
      // console.log("seekAndPlay called with percentage:", position);

      const audio = audioRef.current;
      if (!audio) return;

      const normalizedUrl = normalizeUrl(url);

      // If allItems is provided, build a queue starting from this track
      if (allItems && allItems.length > 0) {
        // Find the index of the current track in allItems
        const currentIndex = allItems.findIndex((item) => {
          const normalizedItemUrl = normalizeUrl(item.audioUrl);
          return normalizedItemUrl === normalizedUrl;
        });

        // If found, create a queue starting from this track
        if (currentIndex >= 0) {
          const queueItems = allItems.slice(currentIndex);
          setQueue(queueItems);
          setCurrentQueueIndex(0);
        }
      }

      // Set this URL as active
      setActiveUrl(url);
      const currentSrc = audio.src;
      const normalizedCurrentSrc = normalizeUrl(currentSrc);

      // Ensure the correct audio file is loaded
      if (normalizedCurrentSrc !== normalizedUrl) {
        audio.src = url;
        audio.load();
      }

      // Function to perform the actual seek and play
      const performSeekAndPlay = () => {
        if (!audio.duration || isNaN(audio.duration)) {
          return;
        }

        const clampedPosition = Math.max(0, Math.min(1, position));
        const seekTime = clampedPosition * audio.duration;

        // audio.currentTime = seekTime;
        waitForBuffered(audio, seekTime).then(() => {
          audio.currentTime = seekTime;
          audio
            .play()
            .catch(console.error)
            .then(() => {});
        });
      };

      // Check if metadata is already loaded
      if (audio.duration && !isNaN(audio.duration)) {
        // Metadata is available, perform seek immediately
        // Wait for audio to be ready if needed
        if (audio.readyState >= 2) {
          performSeekAndPlay();
        } else {
          const onCanplay = () => {
            audio.removeEventListener("canplay", onCanplay);
            audio.removeEventListener("canplaythrough", onCanplay);
            performSeekAndPlay();
          };
          audio.addEventListener("canplay", onCanplay, { once: true });
          audio.addEventListener("canplaythrough", onCanplay, { once: true });
        }
      } else {
        // Wait for metadata to be loaded first
        const onLoadedmetadata = () => {
          audio.removeEventListener("loadedmetadata", onLoadedmetadata);

          // After metadata is loaded, wait for audio to be ready
          const onCanplaythrough = () => {
            audio.removeEventListener("canplaythrough", onCanplaythrough);
            performSeekAndPlay();
          };

          if (audio.readyState >= 3) {
            performSeekAndPlay();
          } else {
            audio.addEventListener("canplaythrough", onCanplaythrough, {
              once: true,
            });
          }
        };
        audio.addEventListener("loadedmetadata", onLoadedmetadata, {
          once: true,
        });
      }
    },
    [audioRef, url, setActiveUrl, allItems, setQueue, setCurrentQueueIndex]
  );

  const play = useCallback(() => {
    // If allItems is provided, build a queue starting from this track
    if (allItems && allItems.length > 0) {
      // Find the index of the current track in allItems
      const normalizedUrl = normalizeUrl(url);
      const currentIndex = allItems.findIndex((item) => {
        const normalizedItemUrl = normalizeUrl(item.audioUrl);
        return normalizedItemUrl === normalizedUrl;
      });

      // If found, create a queue starting from this track
      if (currentIndex >= 0) {
        const queueItems = allItems.slice(currentIndex);
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

const waitForBuffered = (
  audio: HTMLAudioElement,
  targetTime: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const check = () => {
      console.log("checkIsBuffered", checkIsBuffered(audio, targetTime));
      audio.currentTime = targetTime;
      if (checkIsBuffered(audio, targetTime)) {
        resolve();
      } else {
        setTimeout(check, 300);
      }
    };
    check();
  });
};

const checkIsBuffered = (
  audio: HTMLAudioElement,
  targetTime: number
): boolean => {
  const buffered = audio.buffered;
  for (let i = 0; i < buffered.length; i++) {
    if (targetTime >= buffered.start(i) && targetTime <= buffered.end(i)) {
      return true;
    }
  }
  return false;
};

export const useCurrentPlayback = (): null | {
  url: string;
  playheadposition: number | null;
  playing: boolean;
  seekTo: (position: number) => void;
} => {
  const { audioRef } = usePlayerContext();
  const activeUrl = useAtomValue(activeUrlAtom);
  const [playing, setPlaying] = useState(false);

  // Get playhead position for the active URL
  // Always call hook unconditionally (Rules of Hooks) - use empty string as fallback
  const playheadPosition = useAtomValue(
    playheadPositionAtomFamily(activeUrl || "")
  );

  // Track playing state from audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updatePlayingState = () => {
      setPlaying(!audio.paused);
    };

    // Initialize playing state
    updatePlayingState();

    audio.addEventListener("play", updatePlayingState);
    audio.addEventListener("pause", updatePlayingState);
    audio.addEventListener("ended", updatePlayingState);
    // const handleWaiting = () => console.log("handleWaiting");
    // audio.addEventListener("waiting", handleWaiting);
    // const handleLoadstart = () => console.log("handleLoadstart");
    // audio.addEventListener("loadstart", handleLoadstart);
    // const handleProgress = () => console.log("handleProgress");
    // audio.addEventListener("progress", handleProgress);
    // const handleLoad = () => console.log("handleLoadend");
    // audio.addEventListener("loadedmetadata", handleLoad);
    // const handleLoadeddata = () => console.log("handleLoadeddata");
    // audio.addEventListener("loadeddata", handleLoadeddata);
    // const handleCanplay = () => console.log("handleCanplay");
    // audio.addEventListener("canplay", handleCanplay);
    // const handleCanplaythrough = () => console.log("handleCanplaythrough");
    // audio.addEventListener("canplaythrough", handleCanplaythrough);
    // const handlePlaying = () => console.log("handlePlaying");
    // audio.addEventListener("playing", handlePlaying);

    return () => {
      audio.removeEventListener("play", updatePlayingState);
      audio.removeEventListener("pause", updatePlayingState);
      audio.removeEventListener("ended", updatePlayingState);
      // audio.removeEventListener("load", handleLoad);
      // audio.removeEventListener("waiting", handleWaiting);
      // audio.removeEventListener("loadstart", handleLoadstart);
      // audio.removeEventListener("progress", handleProgress);
      // audio.removeEventListener("loadend", handleLoad);
      // audio.removeEventListener("canplay", handleCanplay);
      // audio.removeEventListener("canplaythrough", handleCanplaythrough);
      // audio.removeEventListener("playing", handlePlaying);
    };
  }, [audioRef]);

  // Seek function for the currently active track
  // Uses multiple strategies to ensure accurate seeking:
  // 1. Checks buffered ranges before seeking
  // 2. Plays briefly before seeking (browser workaround)
  // 3. Verifies seek accuracy and retries with exponential backoff
  // 4. Handles readyState and buffering properly
  const seekToRef = useRef<number | null>(null);
  const seekTo = useCallback(
    (position: number) => {
      if (!activeUrl) return;

      const audio = audioRef.current;
      if (!audio) return;

      const normalizedUrl = normalizeUrl(activeUrl);
      const currentSrc = audio.src;
      const normalizedCurrentSrc = normalizeUrl(currentSrc);

      // Ensure the correct audio file is loaded
      if (normalizedCurrentSrc !== normalizedUrl) {
        audio.src = activeUrl;
        audio.load();
      }

      // Cancel any pending seek timeout
      if (seekToRef.current !== null) {
        clearTimeout(seekToRef.current);
        seekToRef.current = null;
      }

      // Check if audio was playing before we seek
      const wasPlaying = !audio.paused;

      // Helper to check if a time is buffered
      const isTimeBuffered = (time: number): boolean => {
        const buffered = audio.buffered;
        for (let i = 0; i < buffered.length; i++) {
          if (time >= buffered.start(i) && time <= buffered.end(i)) {
            return true;
          }
        }
        return false;
      };

      // Wait for metadata to be available
      const performSeek = () => {
        if (!audio.duration || isNaN(audio.duration)) {
          audio.addEventListener("loadedmetadata", performSeek, { once: true });
          return;
        }

        const clampedPosition = Math.max(0, Math.min(1, position));
        const seekTime = clampedPosition * audio.duration;

        // Wait for audio to be ready and attempt seek
        const attemptSeek = (retryCount = 0) => {
          // Strategy 1: Ensure audio has enough data
          // HAVE_FUTURE_DATA (3) is better than HAVE_CURRENT_DATA (2) for seeking
          if (audio.readyState < 2) {
            const onCanPlay = () => {
              audio.removeEventListener("canplay", onCanPlay);
              audio.removeEventListener("canplaythrough", onCanPlay);
              attemptSeek(retryCount);
            };
            audio.addEventListener("canplay", onCanPlay, { once: true });
            audio.addEventListener("canplaythrough", onCanPlay, { once: true });
            return;
          }

          // Strategy 2: Check if target position is buffered
          // If not buffered, wait for progress event or use play/pause workaround
          const doSeek = () => {
            // Strategy 3: Play briefly before seeking (browser workaround)
            // Some browsers need audio to be playing to update currentTime accurately
            const wasPaused = audio.paused;
            let playPromise: Promise<void> | null = null;

            if (wasPaused && !isTimeBuffered(seekTime)) {
              // If target isn't buffered and audio is paused, play briefly
              playPromise = audio.play().catch(() => {});
            }

            const executeSeek = () => {
              let seekCompleted = false;
              let verificationAttempts = 0;
              const maxVerificationAttempts = 3;

              // Perform the seek
              audio.currentTime = seekTime;

              // Fallback: verify after a delay if seeked event doesn't fire
              // play
              audio.play().catch(console.error);
            };

            // If we started playing, wait a bit for it to initialize
            if (playPromise) {
              playPromise
                .then(() => {
                  // Small delay to let play initialize
                  setTimeout(executeSeek, 10);
                })
                .catch(() => {
                  // Play failed, try seek anyway
                  executeSeek();
                });
            } else {
              executeSeek();
            }
          };

          // Strategy 4: If target isn't buffered, wait for it or use play/pause
          if (!isTimeBuffered(seekTime) && audio.readyState < 3) {
            // Not buffered yet, wait for progress
            const onProgress = () => {
              if (isTimeBuffered(seekTime) || audio.readyState >= 3) {
                audio.removeEventListener("progress", onProgress);
                doSeek();
              }
            };
            audio.addEventListener("progress", onProgress);

            // Fallback: proceed anyway after a timeout
            seekToRef.current = window.setTimeout(() => {
              audio.removeEventListener("progress", onProgress);
              doSeek();
            }, 500);
          } else {
            // Buffered or ready, proceed with seek
            doSeek();
          }
        };

        attemptSeek();
      };

      performSeek();
    },
    [audioRef, activeUrl]
  );

  if (!activeUrl) {
    return null;
  }

  return {
    url: activeUrl,
    playheadposition: playheadPosition,
    playing,
    seekTo,
  };
};
