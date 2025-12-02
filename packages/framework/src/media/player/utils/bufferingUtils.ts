/**
 * Check if a specific time position is buffered in the audio element
 */
export const checkIsBuffered = (
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

/**
 * Wait for a specific time position to be buffered
 */
export const waitForBuffered = (
  audio: HTMLAudioElement,
  targetTime: number
): Promise<void> => {
  return new Promise((resolve) => {
    const check = () => {
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

