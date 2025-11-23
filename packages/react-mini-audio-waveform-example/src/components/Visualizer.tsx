import { useEffect, useRef } from "react";
import { usePlayerContext } from "./Player";
// import { initVisualizer } from "./initVisualizer";

const width = 800;
const height = 400;
export const Visualizer = () => {
  const audioNode = usePlayerContext().audioRef.current;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const preset = "27";
  useEffect(() => {
    if (canvasRef.current && audioNode.audioRef.current) {
      //   initVisualizer(
      //     width,
      //     height,
      //     preset,
      //     canvasRef.current,
      //     audioNode.audioRef.current
      //   );
    }
  }, []);
  return <canvas ref={canvasRef} width={width} height={height} />;
};
