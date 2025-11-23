/**
 * Frequency analysis and splitting utilities
 * Data-only processing - no color mapping
 */

export interface SpectralData {
  lowEnergy: number;
  midEnergy: number;
  highEnergy: number;
}

/**
 * Get spectral data for each waveform position using windowed frequency analysis
 * Returns an array where each element contains low, mid, and high frequency energy for that position
 * Optimized for performance with minimal passes over the audio data
 */
export function getSpectralData(
  audioBuffer: AudioBuffer,
  waveformData: number[]
): SpectralData[] {
  const rawData = audioBuffer.getChannelData(0);
  const dataLength = rawData.length;
  const waveformLength = waveformData.length;
  const samplesPerPosition = Math.floor(dataLength / waveformLength);
  const windowSize = Math.min(2048, samplesPerPosition * 2);
  const spectralDataArray: SpectralData[] = new Array(waveformLength);

  // Pre-calculate constants outside the loop
  const SCALE_FACTOR = 100;

  for (let pos = 0; pos < waveformLength; pos++) {
    const startSample = pos * samplesPerPosition;
    const endSample = Math.min(startSample + windowSize, dataLength);
    const segmentLength = endSample - startSample;

    if (segmentLength === 0) {
      spectralDataArray[pos] = { lowEnergy: 0, midEnergy: 0, highEnergy: 0 };
      continue;
    }

    // Pre-calculate step values for this segment
    const lowStep = Math.max(1, segmentLength >> 3); // /8
    const midStep = Math.max(1, segmentLength >> 5); // /32
    const highStep = Math.max(1, segmentLength >> 6); // /64
    const lowIncrement = Math.max(1, lowStep >> 1); // /2
    const midIncrement = Math.max(1, midStep >> 1); // /2

    // Accumulators for RMS and frequency variations
    let rmsSum = 0;
    let lowVariation = 0;
    let lowCount = 0;
    let midVariation = 0;
    let midCount = 0;
    let highVariation = 0;
    let highCount = 0;

    // Single pass: Calculate RMS and high frequency variation
    const highEnd = endSample - highStep;
    for (let i = startSample; i < endSample; i++) {
      const sample = rawData[i]!;
      rmsSum += sample * sample;

      // High frequency variation (fast variations, small step)
      if (i < highEnd) {
        const diff = sample - rawData[i + highStep]!;
        highVariation += Math.abs(diff);
        highCount++;
      }
    }

    // Low frequency - uses larger step, fewer iterations
    const lowEnd = endSample - lowStep;
    for (let i = startSample; i < lowEnd; i += lowIncrement) {
      const diff = rawData[i]! - rawData[i + lowStep]!;
      lowVariation += Math.abs(diff);
      lowCount++;
    }

    // Mid frequency - uses medium step
    const midEnd = endSample - midStep;
    for (let i = startSample; i < midEnd; i += midIncrement) {
      const diff = rawData[i]! - rawData[i + midStep]!;
      midVariation += Math.abs(diff);
      midCount++;
    }

    // Calculate RMS
    const rms = Math.sqrt(rmsSum / segmentLength);

    // Calculate energies with proper averaging and scaling
    const invLowCount = lowCount > 0 ? 1 / lowCount : 0;
    const invMidCount = midCount > 0 ? 1 / midCount : 0;
    const invHighCount = highCount > 0 ? 1 / highCount : 0;

    spectralDataArray[pos] = {
      lowEnergy: lowVariation * invLowCount * rms * SCALE_FACTOR,
      midEnergy: midVariation * invMidCount * rms * SCALE_FACTOR,
      highEnergy: highVariation * invHighCount * rms * SCALE_FACTOR,
    };
  }

  return spectralDataArray;
}
