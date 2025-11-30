/**
 * Color palette definitions for waveform rendering
 */

import type { ColorPalette } from "./canvas-renderer";

/**
 * Predefined color palettes
 */
export const COLOR_PALETTES: Record<string, ColorPalette> = {
  classic: {
    background: "#fff",
    lowFrequency: "#000",
    midFrequency: "#555",
    highFrequency: "#000",
    centerLine: "#FFF",
  },
  vibrant: {
    background: "#fff",
    lowFrequency: "#FF6B6B", // Red for bass
    midFrequency: "#4ECDC4", // Teal for mid
    highFrequency: "#45B7D1", // Blue for high
    centerLine: "#95A5A6",
  },
  dark: {
    background: "#1a1a1a",
    lowFrequency: "#E74C3C", // Red
    midFrequency: "#3498DB", // Blue
    highFrequency: "#2ECC71", // Green
    centerLine: "#ECF0F1",
  },
  neon: {
    background: "#000",
    lowFrequency: "#FF00FF", // Magenta
    midFrequency: "#00FFFF", // Cyan
    highFrequency: "#FFFF00", // Yellow
    centerLine: "#FFFFFF",
  },
  pastel: {
    background: "#FFF8F0",
    lowFrequency: "#FFB3BA", // Light pink
    midFrequency: "#BAFFC9", // Light green
    highFrequency: "#BAE1FF", // Light blue
    centerLine: "#888",
  },
  monochrome: {
    background: "#fff",
    lowFrequency: "#333",
    midFrequency: "#666",
    highFrequency: "#999",
    centerLine: "#000",
  },
  "monochrome-dark": {
    background: "#1a1a1a",
    lowFrequency: "#e0e0e0",
    midFrequency: "#b0b0b0",
    highFrequency: "#808080",
    centerLine: "#fff",
  },
  "monochrome-light": {
    background: "#fafafa",
    lowFrequency: "#1a1a1a",
    midFrequency: "#2a2a2a",
    highFrequency: "#3a3a3a",
    centerLine: "#000",
  },
  "monochrome-inverted": {
    background: "#000",
    lowFrequency: "#fff",
    midFrequency: "#ccc",
    highFrequency: "#999",
    centerLine: "#fff",
  },
  "monochrome-blue-tint": {
    background: "#f8f9fa",
    lowFrequency: "#2c3e50",
    midFrequency: "#34495e",
    highFrequency: "#5d6d7e",
    centerLine: "#1a252f",
  },
  "monochrome-warm": {
    background: "#faf8f5",
    lowFrequency: "#3d3529",
    midFrequency: "#4a4235",
    highFrequency: "#5a5245",
    centerLine: "#2a241f",
  },
  "monochrome-cool": {
    background: "#f5f7f8",
    lowFrequency: "#2d3436",
    midFrequency: "#3d4446",
    highFrequency: "#4d5456",
    centerLine: "#1d2426",
  },
  "monochrome-charcoal": {
    background: "#2c2c2c",
    lowFrequency: "#d4d4d4",
    midFrequency: "#a8a8a8",
    highFrequency: "#7c7c7c",
    centerLine: "#fff",
  },
};

/**
 * Get a color palette by name, or return default
 */
export function getColorPalette(name: string): ColorPalette {
  return COLOR_PALETTES[name] ?? COLOR_PALETTES.classic;
}

/**
 * Get all available palette names
 */
export function getPaletteNames(): string[] {
  return Object.keys(COLOR_PALETTES);
}

/**
 * Generate an OKLCH-based color palette from hue and saturation
 * @param hue - Hue in degrees (0-360)
 * @param saturation - Chroma/saturation (0-0.4, typically 0.1-0.3 works well)
 * @param hueSpread - Maximum hue spread in degrees (0-180), controls color variation
 * @param contrast - Lightness contrast (-1 to 1), controls lightness differences between frequencies. Negative values invert the relationship.
 * @param lightness - Base lightness (0-1), controls overall lightness of the palette
 * @returns A ColorPalette with OKLCH colors
 */
export function generateOklchPalette(
  hue: number,
  saturation: number,
  hueSpread: number = 60,
  contrast: number = 0,
  lightness: number = 0.5
): ColorPalette {
  // Clamp values to valid ranges
  const clampedHue = Math.max(0, Math.min(360, hue));
  const clampedSaturation = Math.max(0, Math.min(0.4, saturation));
  const clampedHueSpread = Math.max(0, Math.min(180, hueSpread));
  const clampedContrast = Math.max(-1, Math.min(1, contrast));
  const clampedLightness = Math.max(0.1, Math.min(0.9, lightness));

  // Base lightness for mid frequency
  const baseLightness = clampedLightness;

  // Calculate lightness differences based on contrast
  // Contrast 0 = all same lightness
  // Contrast > 0: low darker, high lighter (normal)
  // Contrast < 0: low lighter, high darker (inverted)
  const lightnessRange = Math.abs(clampedContrast) * 0.4; // Max range of 0.4
  const isInverted = clampedContrast < 0;
  
  // Calculate lightness values and clamp to valid OKLCH range (0-1)
  const lowLightness = Math.max(0, Math.min(1, baseLightness + (isInverted ? lightnessRange : -lightnessRange)));
  const midLightness = baseLightness; // Medium for mid frequency
  const highLightness = Math.max(0, Math.min(1, baseLightness + (isInverted ? -lightnessRange : lightnessRange)));

  // Calculate hue shifts based on hue spread
  // Hue spread 0 = all same hue, Hue spread 180 = maximum variation
  const midHueShift = clampedHueSpread / 3; // 1/3 of spread
  const highHueShift = (clampedHueSpread * 2) / 3; // 2/3 of spread

  const lowHue = clampedHue;
  const midHue = (clampedHue + midHueShift) % 360;
  const highHue = (clampedHue + highHueShift) % 360;

  // Vary saturation slightly for visual interest
  const lowSaturation = clampedSaturation * 1.2; // More saturated
  const midSaturation = clampedSaturation;
  const highSaturation = clampedSaturation * 0.8; // Less saturated

  return {
    background: "oklch(0.98 0 0)", // Very light gray background
    lowFrequency: `oklch(${lowLightness} ${Math.min(
      0.4,
      lowSaturation
    )} ${lowHue})`,
    midFrequency: `oklch(${midLightness} ${Math.min(
      0.4,
      midSaturation
    )} ${midHue})`,
    highFrequency: `oklch(${highLightness} ${Math.min(
      0.4,
      highSaturation
    )} ${highHue})`,
    centerLine: `oklch(${Math.max(0.1, lowLightness - 0.1)} ${Math.min(
      0.4,
      clampedSaturation * 0.5
    )} ${clampedHue})`, // Dark center line
  };
}

