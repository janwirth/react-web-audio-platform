/**
 * Audio loading and processing utilities
 */

import { setupCanvas, renderWaveform } from "./canvas-renderer";
import type { ColorPalette } from "./canvas-renderer";
import { getSpectralData } from "./frequency-split";
import { getWaveformData } from "./waveform-data";

// AudioContext will be created on demand (requires user interaction)
let audioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Decode audio file from URL
 */
export async function decodeAudioFile(
  audioUrl: string,
  audioContext?: AudioContext
): Promise<AudioBuffer> {
  // Validate audioUrl
  if (!audioUrl || typeof audioUrl !== "string") {
    throw new Error(`Invalid audio URL: ${audioUrl}`);
  }

  // Fetch audio file
  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch audio: ${response.status} ${response.statusText}`
    );
  }

  // Check Content-Type header
  const contentType = response.headers.get("Content-Type");
  const urlLower = audioUrl.toLowerCase();
  const hasAudioExtension =
    urlLower.endsWith(".mp3") ||
    urlLower.endsWith(".wav") ||
    urlLower.endsWith(".ogg") ||
    urlLower.endsWith(".m4a") ||
    urlLower.endsWith(".aac") ||
    urlLower.endsWith(".flac") ||
    urlLower.endsWith(".webm");

  // Warn if Content-Type is missing or not audio-related
  if (!contentType || (!contentType.startsWith("audio/") && !hasAudioExtension)) {
    console.warn(
      `Audio URL may have incorrect Content-Type: "${contentType || "missing"}" for ${audioUrl}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();

  // Check if we got actual data
  if (arrayBuffer.byteLength === 0) {
    throw new Error("Audio file is empty");
  }

  // Decode audio data (use provided context or create on demand)
  const ctx = audioContext || getAudioContext();
  
  try {
    return await ctx.decodeAudioData(arrayBuffer);
  } catch (error) {
    // Provide more helpful error message
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    const formatHint = contentType
      ? `Content-Type: ${contentType}`
      : hasAudioExtension
      ? `File extension suggests audio format`
      : "Unknown format";
    
    throw new Error(
      `Failed to decode audio data: ${errorMessage}. ${formatHint}. ` +
        `File size: ${arrayBuffer.byteLength} bytes. ` +
        `URL: ${audioUrl}`
    );
  }
}

/**
 * Render waveform from an already-decoded AudioBuffer
 */
export function renderWaveformFromBuffer(
  audioBuffer: AudioBuffer,
  container: HTMLElement,
  colorPalette?: Partial<ColorPalette>
): void {
  // Remove any existing waveform
  const existingWaveform = container.querySelector(".waveform-container");
  if (existingWaveform) existingWaveform.remove();

  // Create canvas
  const canvas = document.createElement("canvas");
  const waveformDiv = document.createElement("div");
  waveformDiv.className = "waveform-container";
  waveformDiv.appendChild(canvas);
  container.appendChild(waveformDiv);

  // Setup canvas with proper resolution
  // Get container width for initial sizing
  const containerRect = waveformDiv.getBoundingClientRect();
  const { displayWidth, displayHeight } = setupCanvas(
    canvas,
    containerRect.width || 1000,
    32
  );

  // Get waveform data with resolution matching canvas width
  // Use display width to determine number of samples (no padding)
  const waveformSamples = Math.max(100, Math.floor(displayWidth));
  const waveformData = getWaveformData(audioBuffer, waveformSamples);

  // Get spectral data (simplified, synchronous version)
  const spectralData = getSpectralData(audioBuffer, waveformData);

  // Store current color palette (can be updated externally)
  let currentColorPalette = colorPalette;

  // Render function that can be called on resize
  const render = () => {
    const rect = waveformDiv.getBoundingClientRect();
    const { displayWidth } = setupCanvas(canvas, rect.width, 32);

    // Recalculate waveform data to match new canvas width
    const waveformSamples = Math.max(100, Math.floor(displayWidth));
    const newWaveformData = getWaveformData(audioBuffer, waveformSamples);
    const newSpectralData = getSpectralData(audioBuffer, newWaveformData);

    renderWaveform(
      canvas,
      newWaveformData,
      newSpectralData,
      audioBuffer,
      currentColorPalette
    );
  };

  // Expose method to update color palette
  (waveformDiv as any).updateColorPalette = (
    palette: Partial<ColorPalette>
  ) => {
    currentColorPalette = palette;
    render();
  };

  // Initial render
  render();

  // Setup resize observer to repaint when container resizes
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      requestAnimationFrame(() => {
        render();
      });
    }
  });
  resizeObserver.observe(waveformDiv);
}

/**
 * Load and process audio
 */
export async function loadAndRenderAudio(
  audioUrl: string,
  title: string,
  container: HTMLElement,
  button: HTMLButtonElement,
  colorPalette?: Partial<ColorPalette>,
  audioBuffer?: AudioBuffer
): Promise<AudioBuffer | void> {
  // Remove any existing waveform or error
  const existingWaveform = container.querySelector(".waveform-container");
  const existingError = container.querySelector(".error");
  const existingProcessing = container.querySelector(".processing");
  if (existingWaveform) existingWaveform.remove();
  if (existingError) existingError.remove();
  if (existingProcessing) existingProcessing.remove();

  // Show processing state only if we need to decode
  let processingDiv: HTMLElement | null = null;
  if (!audioBuffer) {
    processingDiv = document.createElement("div");
    processingDiv.className = "processing";
    processingDiv.textContent = "Processing audio... This may take a moment.";
    container.appendChild(processingDiv);

    button.disabled = true;
    button.textContent = "Processing...";
  }

  try {
    // Decode audio if not provided
    const buffer = audioBuffer || (await decodeAudioFile(audioUrl));

    // Remove processing message if it was shown
    if (processingDiv) {
      processingDiv.remove();
    }

    // Render waveform
    renderWaveformFromBuffer(buffer, container, colorPalette);

    button.disabled = false;
    button.textContent = "Re-render Waveform";

    // Return buffer for reuse
    return buffer;
  } catch (error) {
    console.error(`Error processing ${title}:`, error);
    if (processingDiv) {
      processingDiv.remove();
    }
    const errorDiv = document.createElement("div");
    errorDiv.className = "error";
    errorDiv.textContent = `Error loading ${title}: ${
      error instanceof Error ? error.message : String(error)
    }`;
    container.appendChild(errorDiv);

    button.disabled = false;
    button.textContent = "Render Waveform";
    throw error;
  }
}
