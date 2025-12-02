import { useEffect, useRef, useCallback } from "react";
import { setupCanvas, renderWaveform } from "./lib/canvas-renderer";
import type { ColorPalette, NormalizationConfig } from "./lib/canvas-renderer";
import useResizeObserver from "use-resize-observer";
import { useDebouncedTrailingHook } from "./hooks/useDebouncedTrailingHook";
import {
  useWaveformRenderData,
  type WaveformRenderData,
} from "./hooks/useWaveformRenderData";

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
