import { useEffect, useRef, useState, useCallback } from "react";
import { setupCanvas, renderWaveform } from "./lib/canvas-renderer";
import type { ColorPalette, NormalizationConfig } from "./lib/canvas-renderer";
import { getSpectralData, type SpectralData } from "./lib/frequency-split";
import { getWaveformData } from "./lib/waveform-data";
import { loadAudioBuffer } from "../audio-context";
import { useAudioContext } from "../audio-context";
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
 * Get cache key for localStorage based on audioUrl
 */
const getCacheKey = (audioUrl: string): string => {
  return `waveform-data-${audioUrl}`;
};

/**
 * Load cached render data from localStorage
 */
const loadCachedRenderData = (audioUrl: string): WaveformRenderData | null => {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  try {
    const cachedData = localStorage.getItem(getCacheKey(audioUrl));
    if (!cachedData) {
      return null;
    }

    const parsed = JSON.parse(cachedData);
    // Only accept valid WaveformRenderData format, discard old formats
    if (
      parsed &&
      Array.isArray(parsed.waveformData) &&
      Array.isArray(parsed.spectralData)
    ) {
      return parsed;
    }
  } catch (e) {
    // Invalid cache data, ignore
    console.warn("Failed to parse cached waveform data:", e);
  }

  return null;
};

/**
 * Save render data to localStorage
 */
const saveCachedRenderData = (
  audioUrl: string,
  data: WaveformRenderData
): void => {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    localStorage.setItem(getCacheKey(audioUrl), JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to save cached waveform data:", e);
  }
};

/**
 * Load and compute both waveform and spectral data together
 * Spectral data depends on waveform data length, so we compute them together
 * Uses localStorage caching by default if cachedRenderData is not provided
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

    // Determine which cached data to use:
    // 1. Use provided cachedRenderData if available
    // 2. Otherwise, try to load from localStorage
    let effectiveCachedData: WaveformRenderData | null = null;

    if (
      cachedRenderData &&
      Array.isArray(cachedRenderData.waveformData) &&
      Array.isArray(cachedRenderData.spectralData)
    ) {
      effectiveCachedData = cachedRenderData;
    } else {
      // Try loading from localStorage as default cache strategy
      effectiveCachedData = loadCachedRenderData(audioUrl);
    }

    // If we have cached render data with both waveform and spectral data, use it directly
    // Do NOT load the audio buffer if we have cached data
    if (effectiveCachedData) {
      setData(effectiveCachedData);
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
        const renderData = { waveformData, spectralData };

        // Save to localStorage as default cache strategy
        saveCachedRenderData(audioUrl, renderData);

        setData(renderData);
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

  const { width } = useResizeObserver({
    ref: wrapperRef as React.RefObject<Element>,
  });
  const debounceDelay = 10;

  // Debounce all render params with delay
  const debouncedWidth = useDebouncedTrailingHook(width, debounceDelay);
  const debouncedHeight = useDebouncedTrailingHook(height, debounceDelay);
  const debouncedColorPalette = useDebouncedTrailingHook(
    colorPalette,
    debounceDelay
  );
  const debouncedNormalizationConfig = useDebouncedTrailingHook(
    normalizationConfig,
    debounceDelay
  );

  // Store the latest render function in a ref to avoid triggering effects when it changes
  const handleResizeRef = useRef<
    ((canvasWidth: number, canvasHeight: number) => void) | undefined
  >(undefined);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleResize = useCallback(
    (canvasWidth: number, canvasHeight: number) => {
      // console.log("handleResize", canvasWidth, canvasHeight);
      const canvas = canvasRef.current;
      if (!canvas || !renderData) return;

      setupCanvas(canvas, canvasWidth, canvasHeight);

      // Ensure canvas stretches to fill width using CSS
      canvas.style.width = "100%";
      canvas.style.height = `${canvasHeight}px`;
      canvas.style.objectFit = "fill";
      canvas.style.display = "block";

      // Render with pre-computed data and debounced params
      // The renderer handles interpolation for different canvas sizes
      // console.log("rendering waveform", audioUrl);
      renderWaveform(
        canvas,
        renderData.waveformData,
        renderData.spectralData,
        debouncedColorPalette,
        debouncedNormalizationConfig
      );
    },
    [renderData, debouncedColorPalette, debouncedNormalizationConfig]
  );

  // Keep the ref updated with the latest function
  useEffect(() => {
    handleResizeRef.current = handleResize;
  }, [handleResize]);

  // Trigger initial render when canvas becomes available and has width
  // This handles the case where renderData is ready but resize observer hasn't fired yet
  useEffect(() => {
    if (!renderData || debouncedWidth) return; // Skip if we already have debouncedWidth

    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    // Use requestAnimationFrame to ensure DOM has been laid out
    const rafId = requestAnimationFrame(() => {
      const canvasWidth = canvas.clientWidth || wrapper.clientWidth;
      if (canvasWidth > 0) {
        handleResizeRef.current?.(canvasWidth, debouncedHeight);
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, [renderData, debouncedHeight]); // Only depend on renderData and height, not debouncedWidth

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onClickAtPercentage) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    onClickAtPercentage(percentage);
  };

  // Trigger re-render when debounced params change
  // Debounce the actual handleResize call to prevent excessive renders
  useEffect(() => {
    if (!renderData) return;

    // Use debouncedWidth if available, otherwise fall back to canvas clientWidth
    const effectiveWidth =
      debouncedWidth ??
      canvasRef.current?.clientWidth ??
      wrapperRef.current?.clientWidth;

    // If we still don't have a width, wait for it
    if (!effectiveWidth) return;

    // Clear any existing timeout
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    // Debounce the resize call
    resizeTimeoutRef.current = setTimeout(() => {
      handleResizeRef.current?.(effectiveWidth, debouncedHeight);
    }, debounceDelay);

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [
    debouncedWidth,
    debouncedHeight,
    debouncedColorPalette,
    debouncedNormalizationConfig,
    renderData,
  ]);

  if (loading) {
    return (
      <div ref={wrapperRef} style={{ width: "100%" }}>
        <canvas
          ref={canvasRef}
          height={height}
          style={{
            width: "100%",
            height: `${height}px`,
            objectFit: "fill",
            display: "block",
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
          height={height}
          style={{
            width: "100%",
            height: `${height}px`,
            objectFit: "fill",
            display: "block",
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
