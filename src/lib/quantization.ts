/**
 * Quantization utilities for waveform data
 */

/**
 * Quantize a normalized amplitude value to a specified number of levels
 * @param normalizedValue - Value between 0 and 1
 * @param levels - Number of quantization levels (default: 8)
 * @returns Quantized value between 0 and 1
 */
export function quantizeAmplitude(
  normalizedValue: number,
  levels: number = 8
): number {
  const quantizedLevel = Math.floor(normalizedValue * levels);
  const clampedLevel = Math.min(levels - 1, Math.max(0, quantizedLevel));
  return clampedLevel / levels;
}

/**
 * Quantize an array of waveform amplitudes to specified levels
 * @param waveformData - Array of amplitude values
 * @param maxAmplitude - Maximum amplitude for normalization
 * @param levels - Number of quantization levels (default: 8)
 * @returns Array of quantized amplitude values
 */
export function quantizeWaveform(
  waveformData: number[],
  maxAmplitude: number,
  levels: number = 8
): number[] {
  return waveformData.map((val) => {
    const normalized = val / maxAmplitude;
    const quantized = quantizeAmplitude(normalized, levels);
    return quantized * maxAmplitude;
  });
}
