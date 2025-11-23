/// <reference lib="DOM" />

/**
 * Canvas rendering utilities for waveforms
 */

import { quantizeAmplitude } from "./quantization";
import type { SpectralData } from "./frequency-split";

// Default colors
const DEFAULT_COLOR_BACKGROUND = "#fff";
const DEFAULT_COLOR_LOW_FREQUENCY = "#000";
const DEFAULT_COLOR_MID_FREQUENCY = "#555";
const DEFAULT_COLOR_HIGH_FREQUENCY = "#000";
const DEFAULT_COLOR_CENTER_LINE = "#FFF";

// Resolution settings
const WAVEFORM_QUANTIZATION_LEVELS = 8; // Amplitude quantization levels (was 8)
const FREQUENCY_QUANTIZATION_LEVELS = 16; // Frequency range quantization levels (was 16)
const HORIZONTAL_RESOLUTION_MULTIPLIER = 1; // Horizontal resolution multiplier (was 1)

// Default normalization configuration
// Each entry specifies: [percentile, targetAmplitude] as MINIMUM thresholds
// e.g., [0.5, 0.5] means "at least 50% of samples should be >= 50% amplitude"
// e.g., [0.5, 1.0] means "at least 50% of samples should be >= 100% amplitude"
// e.g., [0.6, 0.9] means "at least 60% of samples should be >= 90% amplitude"
// All constraints must be satisfied, so we use the most restrictive one (smallest effectiveMax)
export interface NormalizationConfig {
  constraints: Array<[percentile: number, targetAmplitude: number]>;
}

const DEFAULT_NORMALIZATION_CONFIG: NormalizationConfig = {
  constraints: [
    [0.5, 1.0], // 50% of track are at 100%
  ],
};

/**
 * Color palette for waveform rendering
 */
export interface ColorPalette {
  background: string;
  lowFrequency: string;
  midFrequency: string;
  highFrequency: string;
  centerLine: string;
}

/**
 * Setup canvas with proper resolution matching display size
 */
export function setupCanvas(
  canvas: HTMLCanvasElement,
  containerWidth?: number,
  containerHeight?: number
): { displayWidth: number; displayHeight: number } {
  const dpr =
    (typeof window !== "undefined" ? window.devicePixelRatio : 1) || 1;
  const displayWidth = containerWidth || canvas.clientWidth || 1000;
  const displayHeight = containerHeight || canvas.clientHeight || 200;

  // Set display size (CSS pixels)
  canvas.style.width = displayWidth + "px";
  canvas.style.height = displayHeight + "px";

  // Set actual size in memory (scaled for device pixel ratio)
  canvas.width = displayWidth * dpr;
  canvas.height = displayHeight * dpr;

  // Scale context to handle device pixel ratio
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | null;
  if (!ctx) {
    throw new Error("Could not get 2d context from canvas");
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
  ctx.scale(dpr, dpr);

  return { displayWidth, displayHeight };
}

/**
 * Render waveform with stacked frequency ranges (low = gray, mid = blue, high = black)
 */
export function renderWaveform(
  canvas: HTMLCanvasElement,
  waveformData: number[],
  spectralData: SpectralData[],
  colorPalette?: Partial<ColorPalette>,
  normalizationConfig?: Partial<NormalizationConfig>
): void {
  // Performance profiling: start total render
  if (typeof performance !== "undefined" && performance.mark) {
    performance.mark("waveform-render-start");
  }

  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | null;
  if (!ctx) {
    throw new Error("Could not get 2d context from canvas");
  }

  // Use provided color palette or defaults
  const colors: ColorPalette = {
    background: colorPalette?.background ?? DEFAULT_COLOR_BACKGROUND,
    lowFrequency: colorPalette?.lowFrequency ?? DEFAULT_COLOR_LOW_FREQUENCY,
    midFrequency: colorPalette?.midFrequency ?? DEFAULT_COLOR_MID_FREQUENCY,
    highFrequency: colorPalette?.highFrequency ?? DEFAULT_COLOR_HIGH_FREQUENCY,
    centerLine: colorPalette?.centerLine ?? DEFAULT_COLOR_CENTER_LINE,
  };

  const dpr =
    (typeof window !== "undefined" ? window.devicePixelRatio : 1) || 1;
  const displayWidth = canvas.width / dpr; // Use display width, not internal width
  const height = canvas.height / dpr; // Use display height, not internal height
  // Apply horizontal resolution multiplier for higher detail
  const width = displayWidth * HORIZONTAL_RESOLUTION_MULTIPLIER;
  const padding = 0;

  // Scale context horizontally to render at higher resolution
  ctx.save();
  ctx.scale(1 / HORIZONTAL_RESOLUTION_MULTIPLIER, 1);

  // Clear canvas with transparent background (use scaled width for clearing)
  ctx.clearRect(0, 0, width, height);

  const bottomY = height;
  const waveformWidth = width - padding * 2;
  const step = waveformWidth / waveformData.length;

  // Normalize levels using configurable multi-constraint normalization
  const maxWaveform = Math.max(...waveformData);
  const maxAmplitude = height - padding;
  let normalizedWaveform: number[];

  if (maxWaveform > 0 && waveformData.length > 0) {
    // Merge user config with defaults
    const config: NormalizationConfig = {
      constraints:
        normalizationConfig?.constraints ??
        DEFAULT_NORMALIZATION_CONFIG.constraints,
    };

    // Sort data once for percentile calculations
    const sortedData = [...waveformData].sort((a, b) => a - b);

    // Calculate effectiveMax for each constraint
    // Constraints are MINIMUM thresholds: we need to ensure each percentile reaches at least its target
    // For constraint [percentile, targetAmplitude]:
    //   We want: normalizedPercentileValue >= targetAmplitude
    //   normalizedPercentileValue = (percentileValue / effectiveMax) * maxAmplitude
    //   So: (percentileValue / effectiveMax) >= targetAmplitude
    //   Therefore: effectiveMax <= percentileValue / targetAmplitude
    // To satisfy ALL constraints, we use the minimum (most restrictive) effectiveMax
    // A smaller effectiveMax means more amplification, which ensures all minimums are met
    let effectiveMax = maxWaveform;

    for (const [percentile, targetAmplitude] of config.constraints) {
      // Clamp percentile to valid range [0, 1]
      const clampedPercentile = Math.max(0, Math.min(1, percentile));
      // Clamp targetAmplitude to valid range [0, 1]
      const clampedTarget = Math.max(0, Math.min(1, targetAmplitude));

      // Find the percentile value in original data
      const percentileIndex = Math.floor(sortedData.length * clampedPercentile);
      const percentileValue = sortedData[percentileIndex] ?? 0;

      if (percentileValue > 0 && clampedTarget > 0) {
        // Calculate the maximum effectiveMax that satisfies this constraint
        // effectiveMax must be <= percentileValue / clampedTarget to meet the minimum threshold
        const maxAllowedEffectiveMax = percentileValue / clampedTarget;
        // Use the minimum (most restrictive) effectiveMax to satisfy all constraints
        effectiveMax = Math.min(effectiveMax, maxAllowedEffectiveMax);
      }
    }

    // Normalize using effective max
    // This amplifies all values proportionally, ensuring all constraints are met
    normalizedWaveform = waveformData.map((val) => {
      const normalized = (val / effectiveMax) * maxAmplitude;
      // Clamp to maxAmplitude to prevent overflow (peaks may exceed 100% but we clamp for rendering)
      const clamped = Math.min(normalized, maxAmplitude);
      // Quantize to WAVEFORM_QUANTIZATION_LEVELS levels
      const quantized = quantizeAmplitude(
        clamped / maxAmplitude,
        WAVEFORM_QUANTIZATION_LEVELS
      );
      return quantized * maxAmplitude;
    });
  } else {
    // Fallback: no data or all zeros
    normalizedWaveform = waveformData.map((val) => {
      const normalized =
        maxWaveform > 0 ? (val / maxWaveform) * maxAmplitude : 0;
      const quantized = quantizeAmplitude(
        normalized / maxAmplitude,
        WAVEFORM_QUANTIZATION_LEVELS
      );
      return quantized * maxAmplitude;
    });
  }

  // Find max energy values for normalization
  let maxLowEnergy = 0;
  let maxMidEnergy = 0;
  let maxHighEnergy = 0;
  for (let i = 0; i < spectralData.length; i++) {
    const spectral = spectralData[i];
    if (spectral) {
      maxLowEnergy = Math.max(maxLowEnergy, spectral.lowEnergy);
      maxMidEnergy = Math.max(maxMidEnergy, spectral.midEnergy);
      maxHighEnergy = Math.max(maxHighEnergy, spectral.highEnergy);
    }
  }

  // Performance profiling: end setup phase, start data collection
  if (typeof performance !== "undefined" && performance.mark) {
    performance.mark("waveform-setup-end");
    performance.mark("waveform-data-collection-start");
  }

  // Draw waveform with stacked frequency ranges using filled rectangles
  // Disable image smoothing for crisp edges
  ctx.imageSmoothingEnabled = false;

  // Round step to ensure pixel alignment
  const rectWidth = Math.max(1, Math.floor(step)); // Width of each rectangle, rounded to whole pixels

  // Helper function to get interpolated value for a pixel column
  const getInterpolatedData = (pixelX: number) => {
    // Convert pixel X to waveform data index
    const dataIndex = (pixelX - padding) / step;
    const prevIndex = Math.floor(dataIndex);
    const nextIndex = Math.ceil(dataIndex);
    const t = dataIndex - prevIndex;

    // Get previous and next frames
    const prevAmplitude: number =
      prevIndex >= 0 && prevIndex < normalizedWaveform.length
        ? normalizedWaveform[prevIndex] ?? 0
        : 0;
    const nextAmplitude: number =
      nextIndex >= 0 && nextIndex < normalizedWaveform.length
        ? normalizedWaveform[nextIndex] ?? 0
        : 0;

    const prevSpectral: SpectralData =
      prevIndex >= 0 && prevIndex < spectralData.length
        ? spectralData[prevIndex] ?? {
            lowEnergy: 0,
            midEnergy: 0,
            highEnergy: 0,
          }
        : { lowEnergy: 0, midEnergy: 0, highEnergy: 0 };
    const nextSpectral: SpectralData =
      nextIndex >= 0 && nextIndex < spectralData.length
        ? spectralData[nextIndex] ?? {
            lowEnergy: 0,
            midEnergy: 0,
            highEnergy: 0,
          }
        : { lowEnergy: 0, midEnergy: 0, highEnergy: 0 };

    // Interpolate amplitude
    let amplitude = 0;
    if (prevAmplitude > 0 && nextAmplitude > 0) {
      amplitude = prevAmplitude * (1 - t) + nextAmplitude * t;
    } else if (prevAmplitude > 0) {
      amplitude = prevAmplitude;
    } else if (nextAmplitude > 0) {
      amplitude = nextAmplitude;
    }

    // Interpolate spectral data
    const spectral: SpectralData = {
      lowEnergy: prevSpectral.lowEnergy * (1 - t) + nextSpectral.lowEnergy * t,
      midEnergy: prevSpectral.midEnergy * (1 - t) + nextSpectral.midEnergy * t,
      highEnergy:
        prevSpectral.highEnergy * (1 - t) + nextSpectral.highEnergy * t,
    };

    return { amplitude, spectral };
  };

  // Iterate through pixel columns instead of waveform data points
  const startX = padding;
  const endX = width - padding;

  // Track previous quantized levels for smoothing (ensure max 1 step difference)
  const quantizationLevels = FREQUENCY_QUANTIZATION_LEVELS;
  // let prevLowLevel: number | null = null;
  // let prevMidLevel: number | null = null;
  // let prevHighLevel: number | null = null;

  // Helper function to quantize with smoothing constraint
  // const quantizeWithSmoothing = (
  //   normalizedValue: number,
  //   prevLevel: number | null,
  //   levels: number
  // ): { quantizedValue: number; quantizedLevel: number } => {
  //   const targetLevel = Math.floor(normalizedValue * levels);
  //   const clampedTargetLevel = Math.min(levels - 1, Math.max(0, targetLevel));

  //   if (prevLevel === null) {
  //     // First column, no constraint
  //     return {
  //       quantizedValue: clampedTargetLevel / levels,
  //       quantizedLevel: clampedTargetLevel,
  //     };
  //   }

  //   // Constrain to max 1 step difference from previous
  //   const maxDiff = 1;
  //   let smoothedLevel = clampedTargetLevel;
  //   if (Math.abs(clampedTargetLevel - prevLevel) > maxDiff) {
  //     // Clamp to one step away from previous
  //     smoothedLevel =
  //       clampedTargetLevel > prevLevel
  //         ? prevLevel + maxDiff
  //         : prevLevel - maxDiff;
  //     smoothedLevel = Math.min(levels - 1, Math.max(0, smoothedLevel));
  //   }

  //   return {
  //     quantizedValue: smoothedLevel / levels,
  //     quantizedLevel: smoothedLevel,
  //   };
  // };

  // First pass: collect all column data
  interface ColumnData {
    x: number;
    amplitude: number;
    spectral: SpectralData;
    lowAmplitude: number;
    midAmplitude: number;
    highAmplitude: number;
    totalAmplitude: number; // Sum of all frequencies
  }

  const columns: ColumnData[] = [];

  for (let pixelX = startX; pixelX < endX; pixelX += rectWidth) {
    const x = Math.floor(pixelX);
    const { amplitude, spectral } = getInterpolatedData(pixelX);

    if (amplitude === 0) continue;

    // Normalize energies (0-1) with minimum threshold for visibility
    const normalizedLow =
      maxLowEnergy > 0 ? Math.max(0.1, spectral.lowEnergy / maxLowEnergy) : 0.1;
    const normalizedMid =
      maxMidEnergy > 0 ? Math.max(0.1, spectral.midEnergy / maxMidEnergy) : 0.1;
    const normalizedHigh =
      maxHighEnergy > 0
        ? Math.max(0.1, spectral.highEnergy / maxHighEnergy)
        : 0.1;

    // Calculate how much of the amplitude is low/mid/high frequency
    const totalEnergy = normalizedLow + normalizedMid + normalizedHigh;
    const lowRatio = totalEnergy > 0 ? normalizedLow / totalEnergy : 1 / 3;
    const midRatio = totalEnergy > 0 ? normalizedMid / totalEnergy : 1 / 3;
    const highRatio = totalEnergy > 0 ? normalizedHigh / totalEnergy : 1 / 3;

    // Stack frequency ranges: low frequencies at bottom, mid in middle, high frequencies at top
    let lowAmplitude = amplitude * lowRatio;
    let midAmplitude = amplitude * midRatio;
    let highAmplitude = amplitude * highRatio;

    const totalAmplitude = lowAmplitude + midAmplitude + highAmplitude;

    columns.push({
      x,
      amplitude,
      spectral,
      lowAmplitude,
      midAmplitude,
      highAmplitude,
      totalAmplitude,
    });
  }

  // Performance profiling: end data collection, start peak shaving
  if (typeof performance !== "undefined" && performance.mark) {
    performance.mark("waveform-data-collection-end");
    performance.mark("waveform-peak-shaving-start");
  }

  // Second pass: detect and shave off lone peaks
  for (let i = 1; i < columns.length - 1; i++) {
    const prev = columns[i - 1];
    const curr = columns[i];
    const next = columns[i + 1];

    // TypeScript guard (should never be undefined due to loop bounds)
    if (!prev || !curr || !next) continue;

    // Check if current is a lone peak (taller than both previous and next)
    if (
      curr.totalAmplitude > prev.totalAmplitude &&
      curr.totalAmplitude > next.totalAmplitude
    ) {
      // Shave off the peak: reduce to max of previous and next
      const maxNeighbor = Math.max(prev.totalAmplitude, next.totalAmplitude);
      const reductionRatio = maxNeighbor / curr.totalAmplitude;

      // Scale all frequency amplitudes proportionally
      curr.lowAmplitude *= reductionRatio;
      curr.midAmplitude *= reductionRatio;
      curr.highAmplitude *= reductionRatio;
      curr.totalAmplitude = maxNeighbor;
      curr.amplitude *= reductionRatio;
    }
  }

  // Performance profiling: end peak shaving, start rendering
  if (typeof performance !== "undefined" && performance.mark) {
    performance.mark("waveform-peak-shaving-end");
    performance.mark("waveform-rendering-start");
  }

  // Third pass: render with adjusted values
  for (const column of columns) {
    const x = column.x;
    let lowAmplitude = column.lowAmplitude;
    let midAmplitude = column.midAmplitude;
    let highAmplitude = column.highAmplitude;

    // Quantize all frequency amplitudes to 16 levels (0-15) with smoothing
    // const lowQuantizedResult = quantizeWithSmoothing(
    //   lowAmplitude / maxAmplitude,
    //   prevLowLevel,
    //   quantizationLevels
    // );
    // lowAmplitude = lowQuantizedResult.quantizedValue * maxAmplitude;
    // prevLowLevel = lowQuantizedResult.quantizedLevel;

    // const midQuantizedResult = quantizeWithSmoothing(
    //   midAmplitude / maxAmplitude,
    //   prevMidLevel,
    //   quantizationLevels
    // );
    // midAmplitude = midQuantizedResult.quantizedValue * maxAmplitude;
    // prevMidLevel = midQuantizedResult.quantizedLevel;

    // const highQuantizedResult = quantizeWithSmoothing(
    //   highAmplitude / maxAmplitude,
    //   prevHighLevel,
    //   quantizationLevels
    // );
    // highAmplitude = highQuantizedResult.quantizedValue * maxAmplitude;
    // prevHighLevel = highQuantizedResult.quantizedLevel;

    // Direct quantization without smoothing
    const lowLevel = Math.floor(
      (lowAmplitude / maxAmplitude) * quantizationLevels
    );
    lowAmplitude =
      (Math.min(quantizationLevels - 1, Math.max(0, lowLevel)) /
        quantizationLevels) *
      maxAmplitude;

    const midLevel = Math.floor(
      (midAmplitude / maxAmplitude) * quantizationLevels
    );
    midAmplitude =
      (Math.min(quantizationLevels - 1, Math.max(0, midLevel)) /
        quantizationLevels) *
      maxAmplitude;

    const highLevel = Math.floor(
      (highAmplitude / maxAmplitude) * quantizationLevels
    );
    highAmplitude =
      (Math.min(quantizationLevels - 1, Math.max(0, highLevel)) /
        quantizationLevels) *
      maxAmplitude;

    // Round amplitudes to whole pixels to prevent sub-pixel rendering
    const roundedLowAmplitude = Math.floor(lowAmplitude);
    const roundedMidAmplitude = Math.floor(midAmplitude);
    const roundedHighAmplitude = Math.floor(highAmplitude);
    const roundedBottomY = Math.floor(bottomY);

    // Stack bars vertically without covering each other
    // Low frequency bar at bottom, mid frequency bar in middle, high frequency bar on top
    // Draw from bottom (y = height) upward

    // Draw low frequency range (bass) at the bottom, full width
    ctx.fillStyle = colors.lowFrequency;
    ctx.globalAlpha = 1.0; // Use full opacity for crisp edges
    ctx.fillRect(
      x,
      roundedBottomY - roundedLowAmplitude,
      rectWidth,
      roundedLowAmplitude
    );

    // Draw mid frequency range, stacked on top of low, full width
    ctx.fillStyle = colors.midFrequency;
    ctx.globalAlpha = 1.0; // Use full opacity for crisp edges
    ctx.fillRect(
      x,
      roundedBottomY - roundedLowAmplitude - roundedMidAmplitude,
      rectWidth,
      roundedMidAmplitude
    );

    // Draw high frequency range (treble), stacked on top, full width
    ctx.fillStyle = colors.highFrequency;
    ctx.globalAlpha = 1.0; // Use full opacity for crisp edges
    ctx.fillRect(
      x,
      roundedBottomY -
        roundedLowAmplitude -
        roundedMidAmplitude -
        roundedHighAmplitude,
      rectWidth,
      roundedHighAmplitude
    );
  }

  // Draw line at the bottom with low frequency color
  ctx.fillStyle = colors.lowFrequency;
  ctx.globalAlpha = 1.0;
  const centerLineHeight = Math.round(canvas.height / 24);
  ctx.fillRect(
    0,
    Math.floor(bottomY) - centerLineHeight,
    displayWidth,
    centerLineHeight
  );

  // Performance profiling: end rendering and create measures
  if (
    typeof performance !== "undefined" &&
    performance.mark &&
    performance.measure
  ) {
    performance.mark("waveform-rendering-end");
    performance.mark("waveform-render-end");

    // Create performance measures for each phase
    try {
      performance.measure(
        "waveform-setup",
        "waveform-render-start",
        "waveform-setup-end"
      );
      performance.measure(
        "waveform-data-collection",
        "waveform-data-collection-start",
        "waveform-data-collection-end"
      );
      performance.measure(
        "waveform-peak-shaving",
        "waveform-peak-shaving-start",
        "waveform-peak-shaving-end"
      );
      performance.measure(
        "waveform-rendering",
        "waveform-rendering-start",
        "waveform-rendering-end"
      );
      performance.measure(
        "waveform-total",
        "waveform-render-start",
        "waveform-render-end"
      );
    } catch (e) {
      // Ignore errors if marks don't exist (shouldn't happen, but safe fallback)
    }
  }

  // Restore context state
  ctx.restore();
}
