import { useCallback, useRef } from "react";
import { normalizeUrl } from "../utils/urlUtils";
import { checkIsBuffered } from "../utils/bufferingUtils";
import { usePlayerContext } from "../context/PlayerContext";

/**
 * Hook for seeking to a position in the currently active track
 */
export const useSeek = (
  audioRef: React.RefObject<HTMLAudioElement | null>,
  activeUrl: string | null
) => {
  const seekToRef = useRef<number | null>(null);
  const { setSrc } = usePlayerContext();

  const seekTo = useCallback(
    (position: number) => {
      if (!activeUrl) return;

      const audio = audioRef.current;
      if (!audio) return;

      const normalizedUrl = normalizeUrl(activeUrl);
      const currentSrc = audio.src;
      const normalizedCurrentSrc = normalizeUrl(currentSrc);

      if (normalizedCurrentSrc !== normalizedUrl) {
        setSrc(activeUrl);
      }

      if (seekToRef.current !== null) {
        clearTimeout(seekToRef.current);
        seekToRef.current = null;
      }

      const wasPlaying = !audio.paused;

      const isTimeBuffered = (time: number): boolean => {
        return checkIsBuffered(audio, time);
      };

      const performSeek = () => {
        if (!audio.duration || isNaN(audio.duration)) {
          audio.addEventListener("loadedmetadata", performSeek, { once: true });
          return;
        }

        const clampedPosition = Math.max(0, Math.min(1, position));
        const seekTime = clampedPosition * audio.duration;

        const attemptSeek = (retryCount = 0) => {
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

          const doSeek = () => {
            const wasPaused = audio.paused;
            let playPromise: Promise<void> | null = null;

            if (wasPaused && !isTimeBuffered(seekTime)) {
              playPromise = audio.play().catch(() => {});
            }

            const executeSeek = () => {
              audio.currentTime = seekTime;
              audio.play().catch(console.error);
            };

            if (playPromise) {
              playPromise
                .then(() => {
                  setTimeout(executeSeek, 10);
                })
                .catch(() => {
                  executeSeek();
                });
            } else {
              executeSeek();
            }
          };

          if (!isTimeBuffered(seekTime) && audio.readyState < 3) {
            const onProgress = () => {
              if (isTimeBuffered(seekTime) || audio.readyState >= 3) {
                audio.removeEventListener("progress", onProgress);
                doSeek();
              }
            };
            audio.addEventListener("progress", onProgress);

            seekToRef.current = window.setTimeout(() => {
              audio.removeEventListener("progress", onProgress);
              doSeek();
            }, 500);
          } else {
            doSeek();
          }
        };

        attemptSeek();
      };

      performSeek();
    },
    [audioRef, activeUrl, setSrc]
  );

  return seekTo;
};

