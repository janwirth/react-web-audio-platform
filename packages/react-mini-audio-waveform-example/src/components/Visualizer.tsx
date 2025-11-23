import { useEffect, useRef, useMemo } from "react";
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
  const visualizerRef = useRef<ReturnType<typeof initVisualizer> | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const { presets, presetKeys } = useMemo(() => loadAndSortPresets(), []);

  // Randomly select initial preset index just like in butter.html
  const initialPreset = useMemo(() => {
    const initialPresetIndex = Math.floor(Math.random() * presetKeys.length);
    return presets[presetKeys[initialPresetIndex]];
  }, [presets, presetKeys]);

  // Initialize visualizer once with the randomly selected preset
  useEffect(() => {
    if (canvasRef.current && audioNode && initialPreset) {
      // Clean up previous visualizer if it exists
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      const result = initVisualizer(
        width,
        height,
        initialPreset,
        canvasRef.current,
        audioNode
      );
      visualizerRef.current = result;

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
      };
    }
  }, [audioNode, initialPreset]);

  return (
    <div>
      <canvas ref={canvasRef} width={width} height={height} />
      <PresetSelector
        onPresetHover={(preset) => {
          console.log("preset", preset);
          // Load the clicked preset - this is the exact preset that would be passed to initVisualizer
          if (visualizerRef.current?.visualizer) {
            visualizerRef.current.visualizer.loadPreset(preset, 0);
          }
        }}
      ></PresetSelector>
    </div>
  );
};
