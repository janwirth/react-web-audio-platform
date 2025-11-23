import { useEffect, useRef } from "react";
import { usePlayerContext } from "./Player";

const DEFAULT_SIZE = 32;

interface StereoImagerProps {
  size?: number;
}

interface StereoImagerState {
  audioContext: AudioContext;
  sourceNode: MediaElementAudioSourceNode;
  splitterNode: ChannelSplitterNode;
  leftAnalyser: AnalyserNode;
  rightAnalyser: AnalyserNode;
  gainNode: GainNode;
}

function initStereoImager(
  audioElement: HTMLAudioElement
): StereoImagerState | null {
  try {
    const audioContext = new AudioContext();
    const sourceNode = audioContext.createMediaElementSource(audioElement);

    // Create a channel splitter to separate left and right channels
    const splitterNode = audioContext.createChannelSplitter(2);

    // Create analyser nodes for each channel
    const leftAnalyser = audioContext.createAnalyser();
    const rightAnalyser = audioContext.createAnalyser();

    // Create a gain node to control output volume
    const gainNode = audioContext.createGain();

    // Configure analyser nodes
    leftAnalyser.fftSize = 2048;
    rightAnalyser.fftSize = 2048;
    leftAnalyser.smoothingTimeConstant = 0.8;
    rightAnalyser.smoothingTimeConstant = 0.8;

    // Connect: source -> splitter -> analysers -> gain -> destination
    sourceNode.connect(splitterNode);
    splitterNode.connect(leftAnalyser, 0); // Left channel (channel 0)
    splitterNode.connect(rightAnalyser, 1); // Right channel (channel 1)
    leftAnalyser.connect(gainNode);
    rightAnalyser.connect(gainNode);
    gainNode.connect(audioContext.destination);

    return {
      audioContext,
      sourceNode,
      splitterNode,
      leftAnalyser,
      rightAnalyser,
      gainNode,
    };
  } catch (error) {
    // Handle case where MediaElementAudioSourceNode already exists
    // This can happen if another component already created a source node
    console.warn("Failed to create stereo imager audio context:", error);
    return null;
  }
}

export const StereoImager = ({ size = DEFAULT_SIZE }: StereoImagerProps) => {
  const audioNode = usePlayerContext().audioRef.current;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagerRef = useRef<StereoImagerState | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize stereo imager
  useEffect(() => {
    if (canvasRef.current && audioNode && !imagerRef.current) {
      // Set initial canvas size (always square)
      canvasRef.current.width = size;
      canvasRef.current.height = size;

      const state = initStereoImager(audioNode);
      if (!state) return; // Failed to initialize

      imagerRef.current = state;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Resume audio context if suspended
      if (state.audioContext.state === "suspended") {
        state.audioContext.resume();
      }

      const leftDataArray = new Uint8Array(
        state.leftAnalyser.frequencyBinCount
      );
      const rightDataArray = new Uint8Array(
        state.rightAnalyser.frequencyBinCount
      );

      // Start render loop
      let rendering = true;
      const render = () => {
        if (!rendering || !imagerRef.current || !ctx) return;

        const { leftAnalyser, rightAnalyser, audioContext } = imagerRef.current;

        // Resume audio context if it got suspended
        if (audioContext.state === "suspended") {
          audioContext.resume();
        }

        // Get frequency data for both channels
        leftAnalyser.getByteFrequencyData(leftDataArray);
        rightAnalyser.getByteFrequencyData(rightDataArray);

        // Clear canvas before drawing
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Use exactly 32 frequency bands
        const bandCount = 32;
        const dataStep = Math.floor(leftDataArray.length / bandCount);
        const barWidth = canvas.width / bandCount;
        const barHeight = canvas.height;

        // Draw level meter bars
        ctx.fillStyle = "#6b7280"; // Tailwind gray-500 (mid gray)
        for (let i = 0; i < bandCount; i++) {
          const dataIndex = i * dataStep;

          // Combine both channels (average or max)
          const leftValue = leftDataArray[dataIndex] / 255;
          const rightValue = rightDataArray[dataIndex] / 255;
          const combinedValue = Math.max(leftValue, rightValue); // Use max for visibility

          const barHeightValue = combinedValue * barHeight;
          const x = i * barWidth;
          const barWidthWithSpacing = barWidth * 0.95;

          // Draw bar from bottom
          ctx.fillRect(
            x,
            barHeight - barHeightValue,
            barWidthWithSpacing,
            barHeightValue
          );
        }

        animationFrameRef.current = requestAnimationFrame(render);
      };
      render();

      // Cleanup
      return () => {
        rendering = false;
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        // Close audio context
        if (imagerRef.current?.audioContext.state !== "closed") {
          imagerRef.current?.audioContext.close();
        }
        imagerRef.current = null;
      };
    }
  }, [audioNode, size]);

  // Update canvas size when size prop changes
  useEffect(() => {
    if (imagerRef.current && canvasRef.current) {
      canvasRef.current.width = size;
      canvasRef.current.height = size;
    }
  }, [size]);

  return (
    <div className="bg-white inline-block">
      <canvas ref={canvasRef} width={size} height={size} />
    </div>
  );
};
