import { useEffect, useRef, useMemo, useState } from "react";
import { usePlayerContext } from "../../media/player/Player";
import { initVisualizer } from "./initVisualizer";
import { PresetSelector } from "./PresetSelector";
import butterchurnPresets from "butterchurn-presets";

const width = 800;
const defaultHeight = 400;

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

interface VisualizerProps {
  height?: number;
}

export const Visualizer = ({
  height = defaultHeight,
}: VisualizerProps = {}) => {
  const audioNode = usePlayerContext().audioRef.current;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const visualizerRef = useRef<ReturnType<typeof initVisualizer> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const resizeTimeoutRef = useRef<number | null>(null);
  const [canvasWidth, setCanvasWidth] = useState<number | null>(null);
  const [canvasHeight, setCanvasHeight] = useState<number | null>(null);

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

  // Navigation functions for prev/next preset
  const handlePrevPreset = () => {
    if (!selectedPresetName || presetKeys.length === 0) return;

    const currentIndex = presetKeys.indexOf(selectedPresetName);
    if (currentIndex === -1) return;

    // Wrap around to the last preset if at the beginning
    const prevIndex =
      currentIndex === 0 ? presetKeys.length - 1 : currentIndex - 1;
    const prevPresetName = presetKeys[prevIndex];
    const prevPreset = presets[prevPresetName];

    setSelectedPreset(prevPreset);
    setSelectedPresetName(prevPresetName);
    if (visualizerRef.current?.visualizer) {
      visualizerRef.current.visualizer.loadPreset(prevPreset, 0);
    }
  };

  const handleNextPreset = () => {
    if (!selectedPresetName || presetKeys.length === 0) return;

    const currentIndex = presetKeys.indexOf(selectedPresetName);
    if (currentIndex === -1) return;

    // Wrap around to the first preset if at the end
    const nextIndex =
      currentIndex === presetKeys.length - 1 ? 0 : currentIndex + 1;
    const nextPresetName = presetKeys[nextIndex];
    const nextPreset = presets[nextPresetName];

    setSelectedPreset(nextPreset);
    setSelectedPresetName(nextPresetName);
    if (visualizerRef.current?.visualizer) {
      visualizerRef.current.visualizer.loadPreset(nextPreset, 0);
    }
  };

  // ResizeObserver to update canvas width when wrapper div size changes (debounced by 300ms)
  useEffect(() => {
    if (!wrapperRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newWidth, height: newHeight } = entry.contentRect;
        if (newWidth > 0 && newHeight > 0) {
          // Clear any existing timeout
          if (resizeTimeoutRef.current) {
            window.clearTimeout(resizeTimeoutRef.current);
          }
          // Set new timeout to debounce the resize
          resizeTimeoutRef.current = window.setTimeout(() => {
            setCanvasWidth(newWidth);
            setCanvasHeight(newHeight);
            // Update canvas dimensions immediately when debounced callback fires
            if (canvasRef.current) {
              canvasRef.current.width = newWidth;
              canvasRef.current.height = newHeight;
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
  }, [height]);

  // Initialize visualizer once with the randomly selected preset
  useEffect(() => {
    if (
      canvasRef.current &&
      audioNode &&
      initialPreset &&
      canvasWidth !== null &&
      canvasWidth > 0 &&
      canvasHeight !== null &&
      canvasHeight > 0 &&
      !visualizerRef.current
    ) {
      // Set initial canvas size
      canvasRef.current.width = canvasWidth;
      canvasRef.current.height = canvasHeight;

      const result = initVisualizer(
        canvasWidth,
        canvasHeight,
        initialPreset,
        canvasRef.current,
        audioNode
      );

      // If initialization failed (e.g., source node already exists), skip visualization
      if (!result) {
        console.warn(
          "Visualizer initialization failed - another component may have already created a source node"
        );
        return;
      }

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
  }, [audioNode, initialPreset, canvasWidth, canvasHeight, initialPresetName]);

  // Update visualizer when canvas dimensions change
  useEffect(() => {
    if (
      visualizerRef.current?.visualizer &&
      canvasRef.current &&
      canvasWidth !== null &&
      canvasWidth > 0 &&
      canvasHeight !== null &&
      canvasHeight > 0
    ) {
      canvasRef.current.width = canvasWidth;
      canvasRef.current.height = canvasHeight;

      // Resize the visualizer if it has a resize method
      if (typeof visualizerRef.current.visualizer.resize === "function") {
        visualizerRef.current.visualizer.resize(canvasWidth, canvasHeight);
      }
    }
  }, [canvasWidth, canvasHeight]);

  return (
    <div className="flex flex-col gap-1 h-full" style={{ minHeight: 0 }}>
      <div
        ref={wrapperRef}
        className="bg-gray-100 flex-1"
        style={{ minHeight: 0, position: "relative" }}
      >
        <canvas
          ref={canvasRef}
          width={canvasWidth ?? width}
          height={canvasHeight ?? height}
          style={{ width: "100%", height: "100%", display: "block" }}
        />
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
        onPrevPreset={handlePrevPreset}
        onNextPreset={handleNextPreset}
      ></PresetSelector>
    </div>
  );
};
