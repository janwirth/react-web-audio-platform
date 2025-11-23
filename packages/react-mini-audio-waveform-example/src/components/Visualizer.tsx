import { useEffect, useRef, useMemo, useState } from "react";
import { usePlayerContext } from "./Player";
import { initVisualizer } from "./initVisualizer";
import { PresetSelector } from "./PresetSelector";
import butterchurnPresets from "butterchurn-presets";

const width = 800;
const height = 400;

// Load and sort presets just like in butter.html
function loadAndSortPresets() {
  const allPresets = butterchurnPresets.getPresets();

  // Convert to pairs, sort by key (case-insensitive), convert back to object
  const sortedPairs = Object.entries(allPresets).sort(([a], [b]) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );

  const sortedPresets: Record<string, any> = {};
  const presetKeys: string[] = [];

  sortedPairs.forEach(([key, value]) => {
    sortedPresets[key] = value;
    presetKeys.push(key);
  });

  return { presets: sortedPresets, presetKeys };
}

export const Visualizer = () => {
  const audioNode = usePlayerContext().audioRef.current;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const visualizerRef = useRef<ReturnType<typeof initVisualizer> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const resizeTimeoutRef = useRef<number | null>(null);
  const [canvasWidth, setCanvasWidth] = useState<number | null>(null);

  const { presets, presetKeys } = useMemo(() => loadAndSortPresets(), []);

  // Randomly select initial preset index just like in butter.html
  const { initialPreset, initialPresetName } = useMemo(() => {
    const initialPresetIndex = Math.floor(Math.random() * presetKeys.length);
    const presetName = presetKeys[initialPresetIndex];
    return {
      initialPreset: presets[presetName],
      initialPresetName: presetName,
    };
  }, [presets, presetKeys]);

  // Track the currently selected preset (final selection)
  const [selectedPreset, setSelectedPreset] = useState<any>(null);
  const [selectedPresetName, setSelectedPresetName] = useState<string | null>(
    null
  );

  // ResizeObserver to update canvas width when wrapper div size changes (debounced by 300ms)
  useEffect(() => {
    if (!wrapperRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newWidth } = entry.contentRect;
        if (newWidth > 0) {
          // Clear any existing timeout
          if (resizeTimeoutRef.current) {
            window.clearTimeout(resizeTimeoutRef.current);
          }
          // Set new timeout to debounce the resize
          resizeTimeoutRef.current = window.setTimeout(() => {
            setCanvasWidth(newWidth);
            // Update canvas dimensions immediately when debounced callback fires
            if (canvasRef.current) {
              canvasRef.current.width = newWidth;
              canvasRef.current.height = height;
            }
          }, 300);
        }
      }
    });

    resizeObserver.observe(wrapperRef.current);

    return () => {
      resizeObserver.disconnect();
      if (resizeTimeoutRef.current) {
        window.clearTimeout(resizeTimeoutRef.current);
        resizeTimeoutRef.current = null;
      }
    };
  }, []);

  // Initialize visualizer once with the randomly selected preset
  useEffect(() => {
    if (
      canvasRef.current &&
      audioNode &&
      initialPreset &&
      canvasWidth !== null &&
      canvasWidth > 0 &&
      !visualizerRef.current
    ) {
      // Set initial canvas size
      canvasRef.current.width = canvasWidth;
      canvasRef.current.height = height;

      const result = initVisualizer(
        canvasWidth,
        height,
        initialPreset,
        canvasRef.current,
        audioNode
      );
      visualizerRef.current = result;

      // Set initial preset as selected
      setSelectedPresetName(initialPresetName);
      setSelectedPreset(initialPreset);

      // Start render loop
      let rendering = true;
      const render = () => {
        if (rendering && result.visualizer) {
          result.visualizer.render();
          animationFrameRef.current = requestAnimationFrame(render);
        }
      };
      render();

      // Cleanup
      return () => {
        rendering = false;
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        visualizerRef.current = null;
      };
    }
  }, [audioNode, initialPreset, canvasWidth, initialPresetName]);

  // Update visualizer width when canvas width changes
  useEffect(() => {
    if (
      visualizerRef.current?.visualizer &&
      canvasRef.current &&
      canvasWidth !== null &&
      canvasWidth > 0
    ) {
      canvasRef.current.width = canvasWidth;
      canvasRef.current.height = height;

      // Resize the visualizer if it has a resize method
      if (typeof visualizerRef.current.visualizer.resize === "function") {
        visualizerRef.current.visualizer.resize(canvasWidth, height);
      }
    }
  }, [canvasWidth]);

  return (
    <div className="flex flex-col gap-1">
      <div ref={wrapperRef} className="bg-gray-100">
        <canvas ref={canvasRef} width={canvasWidth ?? width} height={height} />{" "}
      </div>

      <PresetSelector
        selectedPresetName={selectedPresetName}
        onPresetHover={(preset) => {
          // Preview the preset on hover
          if (visualizerRef.current?.visualizer) {
            visualizerRef.current.visualizer.loadPreset(preset, 0);
          }
        }}
        onPresetLeave={() => {
          // Restore to the selected preset when leaving
          if (visualizerRef.current?.visualizer && selectedPreset) {
            visualizerRef.current.visualizer.loadPreset(selectedPreset, 0);
          }
        }}
        onPresetClick={(preset, presetName) => {
          // Final selection on click
          setSelectedPreset(preset);
          setSelectedPresetName(presetName);
          if (visualizerRef.current?.visualizer) {
            visualizerRef.current.visualizer.loadPreset(preset, 0);
          }
        }}
      ></PresetSelector>
    </div>
  );
};
