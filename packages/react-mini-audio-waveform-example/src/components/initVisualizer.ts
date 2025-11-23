// @ts-ignore - CDN import handled by Vite
import butterchurn from "https://unpkg.com/butterchurn@3.0.0-beta.5/dist/butterchurn.js";

export function initVisualizer(
  w: number,
  h: number,
  preset: any,
  canvas: HTMLCanvasElement,
  audioNode: AnalyserNode
) {
  const audioContext = audioNode.context;

  const visualizer = butterchurn.createVisualizer(audioContext, canvas, {
    width: w,
    height: h,
    pixelRatio: window.devicePixelRatio || 1,
    textureRatio: 1,
  });

  visualizer.loadPreset(preset, 0);
  visualizer.connectAudio(audioNode);

  return { visualizer, audioContext };
}
