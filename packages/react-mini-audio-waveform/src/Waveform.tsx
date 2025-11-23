import { useEffect, useRef, useState, useCallback } from "react";
import { setupCanvas, renderWaveform } from "./lib/canvas-renderer";
import type { ColorPalette, NormalizationConfig } from "./lib/canvas-renderer";
import { getSpectralData, type SpectralData } from "./lib/frequency-split";
import { getWaveformData } from "./lib/waveform-data";
import { loadAudioBuffer } from "@janwirth/react-web-audio-context";
import { useAudioContext } from "@janwirth/react-web-audio-context";
import useResizeObserver from "use-resize-observer";
import { useDebouncedTrailingHook } from "./hooks/useDebouncedTrailingHook";

interface WaveformProps {
  onGotData?: (data: WaveformRenderData) => void;
  onClickAtPercentage?: (percentage: number) => void;
  audioUrl: string;
  cachedRenderData?: WaveformRenderData | null;
  colorPalette?: Partial<ColorPalette>;
  normalizationConfig?: Partial<NormalizationConfig>;
  width?: number;
  height?: number;
}

/**
 * Combined waveform and spectral data
 * - waveformData: amplitude values (determines bar height)
 * - spectralData: frequency breakdown (determines color distribution)
 */
export interface WaveformRenderData {
  waveformData: number[];
  spectralData: SpectralData[];
}

/**
 * Load and compute both waveform and spectral data together
 * Spectral data depends on waveform data length, so we compute them together
 */
const useWaveformRenderData = (
  audioUrl: string,
  cachedRenderData?: WaveformRenderData | null
): {
  data: WaveformRenderData | null;
  error: string | null;
  loading: boolean;
} => {
  const audioContext = useAudioContext();
  const [data, setData] = useState<WaveformRenderData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setData(null);

    // Validate audioUrl before attempting to load
    if (!audioUrl || typeof audioUrl !== "string") {
      setError("Invalid audio URL provided");
      setLoading(false);
      return;
    }

    // If we have cached render data with both waveform and spectral data, use it directly
    // Do NOT load the audio buffer if we have cached data
    if (
      cachedRenderData &&
      Array.isArray(cachedRenderData.waveformData) &&
      Array.isArray(cachedRenderData.spectralData)
    ) {
      setData(cachedRenderData);
      setError(null);
      setLoading(false);
      return;
    }

    // Otherwise, load audio and compute data
    loadAudioBuffer(audioContext, audioUrl)
      .then((buffer: AudioBuffer) => {
        // Compute waveform data first (determines resolution)
        const waveformData = getWaveformData(buffer, 600);
        // Then compute spectral data (needs waveform length)
        const spectralData = getSpectralData(buffer, waveformData);
        setData({ waveformData, spectralData });
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("Failed to load audio:", err);
        setError(errorMessage);
        setData(null);
        setLoading(false);
      });
  }, [audioUrl, audioContext, cachedRenderData]);

  return { data, error, loading };
};

export function Waveform({
  audioUrl,
  cachedRenderData,
  colorPalette,
  normalizationConfig,
  onGotData,
  onClickAtPercentage,
  // width = 1000,
  height = 32,
  ...props
}: React.CanvasHTMLAttributes<HTMLCanvasElement> & WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const {
    data: renderData,
    error,
    loading,
  } = useWaveformRenderData(audioUrl, cachedRenderData);
  useEffect(() => {
    if (renderData) {
      onGotData?.(renderData);
    }
  }, [renderData, onGotData]);

  const handleResize = useCallback(
    (canvasWidth: number, _canvasHeight: number) => {
      console.log("handleResize", canvasWidth, _canvasHeight);
      const canvas = canvasRef.current;
      if (!canvas || !renderData) return;

      setupCanvas(canvas, canvasWidth, height);

      // Ensure canvas stretches to fill width using CSS
      canvas.style.width = "100%";
      canvas.style.height = `${height}px`;
      canvas.style.objectFit = "fill";
      canvas.style.display = "block";

      // Render with pre-computed data
      // The renderer handles interpolation for different canvas sizes
      renderWaveform(
        canvas,
        renderData.waveformData,
        renderData.spectralData,
        colorPalette,
        normalizationConfig
      );
    },
    [renderData, colorPalette, normalizationConfig, height]
  );

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onClickAtPercentage) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    onClickAtPercentage(percentage);
  };

  const { width } = useResizeObserver({
    ref: wrapperRef as React.RefObject<Element>,
  });

  // Debounce width changes with 30ms delay
  const debouncedWidth = useDebouncedTrailingHook(width, 300);

  // Trigger re-render when debounced width changes
  useEffect(() => {
    if (debouncedWidth && renderData) {
      handleResize(debouncedWidth, height);
    }
  }, [debouncedWidth, height, handleResize, renderData]);

  if (loading) {
    return (
      <div ref={wrapperRef} style={{ width: "100%" }}>
        <canvas
          ref={canvasRef}
          className="waveform-container"
          style={{
            width: "100%",
            height: `${height}px`,
            objectFit: "fill",
            display: "block",
            padding: "1rem",
            textAlign: "center",
          }}
          onClick={handleClick}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div ref={wrapperRef} style={{ width: "100%" }}>
        <canvas
          ref={canvasRef}
          className="waveform-container"
          style={{
            width: "100%",
            height: `${height}px`,
            objectFit: "fill",
            display: "block",
            padding: "1rem",
            textAlign: "center",
            color: "#ff4444",
          }}
          onClick={handleClick}
        />
      </div>
    );
  }

  return (
    <div ref={wrapperRef} style={{ width: "100%" }}>
      <canvas
        height={height}
        ref={canvasRef}
        onClick={handleClick}
        style={{
          width: "100%",
          height: `${height}px`,
          objectFit: "fill",
          display: "block",
        }}
        {...props}
      />
    </div>
  );
}
