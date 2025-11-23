import { useEffect, useRef } from "react";
import { usePlayerContext } from "./Player";
import { initVisualizer } from "./initVisualizer";

const width = 800;
const height = 400;
export const Visualizer = () => {
  const audioNode = usePlayerContext().audioRef.current;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const preset = "269";
  useEffect(() => {
    console.log("audioNode", audioNode, canvasRef.current);
    if (canvasRef.current && audioNode) {
      initVisualizer(width, height, preset, canvasRef.current, audioNode);
    }
  }, [audioNode]);
  return <canvas ref={canvasRef} width={width} height={height} />;
};
