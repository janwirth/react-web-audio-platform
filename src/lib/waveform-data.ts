/**
 * Waveform data extraction utilities
 */

/**
 * Get waveform data from audio buffer (peaks only up)
 * Aggressively optimized version: samples only 3000 frames from the entire track
 */
export function getWaveformData(
  audioBuffer: AudioBuffer,
  samples: number = 600
): number[] {
  const rawData = audioBuffer.getChannelData(0);
  const dataLength = rawData.length;

  // Limit to 3000 samples total for performance
  const MAX_SAMPLES_TO_PROCESS = 100000;
  const samplesToProcess = Math.min(dataLength, MAX_SAMPLES_TO_PROCESS);

  // Sample evenly across the entire track
  const sampleStep = dataLength / samplesToProcess;
  const sampledData = new Float32Array(samplesToProcess);

  // Sample evenly across the audio buffer
  for (let i = 0; i < samplesToProcess; i++) {
    const idx = Math.floor(i * sampleStep);
    sampledData[i] = rawData[idx] ?? 0;
  }

  // Now process the sampled data into waveform points
  const maxSamples = Math.min(samples, 600);
  const blockSize = Math.floor(samplesToProcess / maxSamples);
  const waveform = new Array<number>(maxSamples);

  // Process blocks with optimized inner loop
  const lastBlockStart = (maxSamples - 1) * blockSize;

  for (let i = 0; i < maxSamples - 1; i++) {
    const startIdx = i * blockSize;
    const endIdx = startIdx + blockSize;
    let sum = 0;

    // Optimized inner loop: unroll for small blocks
    let j = startIdx;
    const endIdxUnrolled = endIdx - 3;

    // Unrolled loop for better performance
    for (; j < endIdxUnrolled; j += 4) {
      const s0 = sampledData[j] ?? 0;
      const s1 = sampledData[j + 1] ?? 0;
      const s2 = sampledData[j + 2] ?? 0;
      const s3 = sampledData[j + 3] ?? 0;
      sum +=
        (s0 < 0 ? -s0 : s0) +
        (s1 < 0 ? -s1 : s1) +
        (s2 < 0 ? -s2 : s2) +
        (s3 < 0 ? -s3 : s3);
    }

    // Handle remaining samples
    for (; j < endIdx; j++) {
      const sample = sampledData[j] ?? 0;
      sum += sample < 0 ? -sample : sample;
    }

    waveform[i] = sum / blockSize;
  }

  // Handle last block separately (may be smaller)
  if (maxSamples > 0) {
    const lastBlockEnd = samplesToProcess;
    let sum = 0;
    const lastBlockSize = lastBlockEnd - lastBlockStart;

    if (lastBlockSize > 0) {
      let j = lastBlockStart;
      const endIdxUnrolled = lastBlockEnd - 3;

      // Unrolled loop for last block
      for (; j < endIdxUnrolled; j += 4) {
        const s0 = sampledData[j] ?? 0;
        const s1 = sampledData[j + 1] ?? 0;
        const s2 = sampledData[j + 2] ?? 0;
        const s3 = sampledData[j + 3] ?? 0;
        sum +=
          (s0 < 0 ? -s0 : s0) +
          (s1 < 0 ? -s1 : s1) +
          (s2 < 0 ? -s2 : s2) +
          (s3 < 0 ? -s3 : s3);
      }

      // Handle remaining samples
      for (; j < lastBlockEnd; j++) {
        const sample = sampledData[j] ?? 0;
        sum += sample < 0 ? -sample : sample;
      }

      waveform[maxSamples - 1] = sum / lastBlockSize;
    } else {
      waveform[maxSamples - 1] = 0;
    }
  }

  // Apply smoothing with 0 attack and 3 frames decay
  // return smoothWaveform(waveform, 3);
  return waveform;
}
