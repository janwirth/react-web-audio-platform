import { normalizeUrl } from "./urlUtils";
import { waitForBuffered, checkIsBuffered } from "./bufferingUtils";

/**
 * Ensure audio element has the correct source loaded
 */
export const ensureAudioSource = (
  audio: HTMLAudioElement,
  url: string,
  setSrc: (url: string) => void
): void => {
  const normalizedUrl = normalizeUrl(url);
  const currentSrc = audio.src;
  const normalizedCurrentSrc = normalizeUrl(currentSrc);

  if (normalizedCurrentSrc !== normalizedUrl) {
    setSrc(url);
  }
};

/**
 * Wait for audio to be ready to play
 */
export const waitForAudioReady = (
  audio: HTMLAudioElement,
  onReady: () => void
): void => {
  if (audio.readyState >= 2) {
    onReady();
    return;
  }

  const onCanplay = () => {
    audio.removeEventListener("canplay", onCanplay);
    audio.removeEventListener("canplaythrough", onCanplay);
    onReady();
  };
  audio.addEventListener("canplay", onCanplay, { once: true });
  audio.addEventListener("canplaythrough", onCanplay, { once: true });
};

/**
 * Wait for metadata to load, then wait for audio to be ready
 */
export const waitForMetadataAndReady = (
  audio: HTMLAudioElement,
  onReady: () => void
): void => {
  if (audio.duration && !isNaN(audio.duration)) {
    if (audio.readyState >= 3) {
      onReady();
    } else {
      waitForAudioReady(audio, onReady);
    }
    return;
  }

  const onLoadedmetadata = () => {
    audio.removeEventListener("loadedmetadata", onLoadedmetadata);

    if (audio.readyState >= 3) {
      onReady();
    } else {
      const onCanplaythrough = () => {
        audio.removeEventListener("canplaythrough", onCanplaythrough);
        onReady();
      };
      audio.addEventListener("canplaythrough", onCanplaythrough, {
        once: true,
      });
    }
  };
  audio.addEventListener("loadedmetadata", onLoadedmetadata, { once: true });
};

/**
 * Perform seek and play operation
 */
export const performSeekAndPlay = async (
  audio: HTMLAudioElement,
  position: number
): Promise<void> => {
  if (!audio.duration || isNaN(audio.duration)) {
    return;
  }

  const clampedPosition = Math.max(0, Math.min(1, position));
  const seekTime = clampedPosition * audio.duration;

  await waitForBuffered(audio, seekTime);
  audio.currentTime = seekTime;
  await audio.play().catch(console.error);
};

/**
 * Perform play from start (position 0)
 */
export const performPlayFromStart = (audio: HTMLAudioElement): void => {
  audio.currentTime = 0;
  audio.play().catch(console.error);
};

