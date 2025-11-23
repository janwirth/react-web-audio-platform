import { useEffect, useRef } from "react";
import { usePlayerContext } from "../player/Player";

const DEFAULT_SIZE = 32;

interface MiniSpectro {
  audioContext: AudioContext;
  sourceNode: MediaElementAudioSourceNode;
  splitterNode: ChannelSplitterNode;
  leftAnalyser: AnalyserNode;
  rightAnalyser: AnalyserNode;
  gainNode: GainNode;
}

function initMiniSpectro(audioElement: HTMLAudioElement): MiniSpectro | null {
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

interface MiniSpectroProps {
  size?: number;
  growFromCenter?: boolean;
}

export const MiniSpectro = ({
  size = DEFAULT_SIZE,
  growFromCenter = true,
}: MiniSpectroProps) => {
  const audioNode = usePlayerContext().audioRef.current;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagerRef = useRef<MiniSpectro | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize stereo imager
  useEffect(() => {
    if (canvasRef.current && audioNode && !imagerRef.current) {
      const canvas = canvasRef.current;
      const dpr = window.devicePixelRatio || 1;

      // Set canvas internal resolution based on DPI
      canvas.width = size * dpr;
      canvas.height = size * dpr;

      // Set canvas CSS size (display size)
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;

      const state = initMiniSpectro(audioNode);
      if (!state) return; // Failed to initialize

      imagerRef.current = state;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Scale context to match device pixel ratio
      ctx.scale(dpr, dpr);

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

        // Clear canvas before drawing (use logical size, not physical)
        ctx.clearRect(0, 0, size, size);

        // Use exactly 32 frequency bands
        const bandCount = 32;
        // Crop away bottom 5% and top 20% of frequencies
        const startOffset = Math.floor(leftDataArray.length * 0.05);
        const endOffset = Math.floor(leftDataArray.length * 0.25);
        const usableLength = leftDataArray.length - startOffset - endOffset;
        const dataStep = Math.floor(usableLength / bandCount);
        const barWidth = size / bandCount;
        const barHeight = size;

        // Draw level meter bars
        for (let i = 0; i < bandCount; i++) {
          const dataIndex = startOffset + i * dataStep;

          // Combine both channels (average or max)
          const leftValue = leftDataArray[dataIndex] / 255;
          const rightValue = rightDataArray[dataIndex] / 255;
          let combinedValue = Math.max(leftValue, rightValue); // Use max for visibility

          // Amplify higher frequencies: apply exponential gain curve
          // Higher frequency bands (higher i) get more amplification
          const frequencyGain = 1 + i / bandCount; // Linear gain from 1x to 3x
          combinedValue = Math.min(1, combinedValue * frequencyGain); // Clamp to 1.0

          // Make bars with higher amplitude darker
          // Map amplitude (0-1) to grayscale (lighter to darker)
          // Higher amplitude = darker color (lower RGB values)
          const grayValue = Math.floor(255 - combinedValue * 180); // Range from 255 (light) to 75 (dark)
          ctx.fillStyle = `rgb(${grayValue}, ${grayValue}, ${grayValue})`;

          const barHeightValue = combinedValue * barHeight;
          const x = i * barWidth;
          const barWidthWithSpacing = barWidth * 0.95;

          // Draw bar based on growFromCenter option
          if (growFromCenter) {
            // Draw bar centered, growing up and down from center
            const centerY = barHeight / 2;
            const halfHeight = barHeightValue / 2;
            ctx.fillRect(
              x,
              centerY - halfHeight,
              barWidthWithSpacing,
              barHeightValue
            );
          } else {
            // Draw bar from bottom
            ctx.fillRect(
              x,
              barHeight - barHeightValue,
              barWidthWithSpacing,
              barHeightValue
            );
          }
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
  }, [audioNode, size, growFromCenter]);

  // Update canvas size when size prop changes
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const dpr = window.devicePixelRatio || 1;

      // Set canvas internal resolution based on DPI
      canvas.width = size * dpr;
      canvas.height = size * dpr;

      // Set canvas CSS size (display size)
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;

      // Re-scale context if it exists
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    }
  }, [size]);

  return (
    <div className="inline-block">
      <canvas ref={canvasRef} />
    </div>
  );
};
