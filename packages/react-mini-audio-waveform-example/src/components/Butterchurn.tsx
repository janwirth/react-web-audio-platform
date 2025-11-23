import React, { useEffect, useRef } from "react";
import butterchurn from "butterchurn";
// import { cn } from "@/lib/utils";

interface ButterchurnProps
  extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
  audioNode: MediaElementAudioSourceNode;
  audioContext: AudioContext;
  preset: any; // butterchurn preset type
  width: number;
  height: number;
}

export const Butterchurn = React.forwardRef<
  HTMLCanvasElement,
  ButterchurnProps
>(
  (
    { audioNode, audioContext, preset, width, height, className, ...props },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const visualizerRef = useRef<butterchurn.Visualizer | null>(null);
    const resolvedRef =
      (ref as React.RefObject<HTMLCanvasElement>) || canvasRef;

    useEffect(() => {
      if (!resolvedRef.current || width === 0 || height === 0) return;

      // Create visualizer
      visualizerRef.current = butterchurn.createVisualizer(
        audioContext,
        resolvedRef.current,
        {
          width,
          height,
        }
      );

      // Connect audio
      if (visualizerRef.current) {
        visualizerRef.current.connectAudio(audioNode);
      }

      // Load preset
      if (visualizerRef.current && preset) {
        visualizerRef.current.loadPreset(preset, 0.0);
      }

      // Set up animation frame
      let animationFrame: number;
      const animate = () => {
        if (visualizerRef.current) {
          visualizerRef.current.render();
        }
        animationFrame = requestAnimationFrame(animate);
      };
      animate();

      return () => {
        cancelAnimationFrame(animationFrame);
      };
    }, [audioNode, audioContext, preset, width, height]);

    // Handle resize
    useEffect(() => {
      if (visualizerRef.current) {
        visualizerRef.current.setRendererSize(width, height);
      }
    }, [width, height]);

    return (
      <canvas
        ref={resolvedRef}
        width={width}
        height={height}
        // className={cn("w-full h-full", className)}
        {...props}
      />
    );
  }
);
