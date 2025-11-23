import butterchurn from "butterchurn";
import butterchurnPresets from "butterchurn-presets";
import { usePlayerContext } from "./Player";
import { useRef } from "react";
import { useEffect } from "react";

// load a preset
const presets = butterchurnPresets.getPresets();
const preset =
  presets["Flexi, martin + geiss - dedicated to the sherwin maxawow"];

export const ButterchurnVisualizer = () => {
  const playerContext = usePlayerContext();
  const canvas = useRef<HTMLCanvasElement>(null);
  const visualizerRef = useRef<ReturnType<
    typeof butterchurn.createVisualizer
  > | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const audioElement = playerContext.audioRef.current;
    if (!canvas.current || !audioElement) return;

    // Create or reuse AudioContext
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const audioContext = audioContextRef.current;

    // Clean up previous visualizer if it exists
    if (visualizerRef.current) {
      try {
        visualizerRef.current.disconnectAudio();
      } catch (error) {
        // Ignore errors if audio was never connected or node is undefined
        console.warn("Error disconnecting audio from visualizer:", error);
      }
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Create visualizer
    const visualizer = butterchurn.createVisualizer(
      audioContext,
      canvas.current,
      {
        width: 800,
        height: 600,
        pixelRatio: window.devicePixelRatio || 1,
      }
    );
    visualizerRef.current = visualizer;

    // Load preset
    visualizer.loadPreset(preset, 0.0);

    // Set renderer size
    visualizer.setRendererSize(1600, 1200);

    // Create audio source node from the audio element
    // Note: createMediaElementSource can only be called once per audio element
    // Check if the audio element already has a source node attached
    let sourceNode = sourceNodeRef.current;
    if (!sourceNode) {
      try {
        sourceNode = audioContext.createMediaElementSource(audioElement);
        sourceNodeRef.current = sourceNode;
        // Connect source to destination for audio output (only once)
        sourceNode.connect(audioContext.destination);
      } catch (error) {
        // If createMediaElementSource fails, the audio element might already have a source
        // In this case, we need to find another way to connect
        console.error("Failed to create media element source:", error);
        return;
      }
    }

    // Connect visualizer to the audio source
    visualizer.connectAudio(sourceNode);

    // Resume audio context if suspended (required for user interaction)
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    // Start render loop
    let rendering = true;
    const render = () => {
      if (rendering && visualizerRef.current) {
        visualizerRef.current.render();
        animationFrameRef.current = requestAnimationFrame(render);
      }
    };
    render();

    // Cleanup function
    return () => {
      rendering = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      // Disconnect visualizer
      if (visualizerRef.current) {
        try {
          visualizerRef.current.disconnectAudio();
        } catch (error) {
          // Ignore errors if audio was never connected or node is undefined
          console.warn("Error disconnecting audio from visualizer:", error);
        }
      }
      // Note: We don't disconnect the source node here because it's tied to the audio element
      // and might be reused. The audio element will handle its own cleanup.
    };
  }, [playerContext.audioRef]);

  return <canvas ref={canvas} width={800} height={600} />;
};
