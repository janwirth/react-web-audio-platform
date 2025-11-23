// @ts-ignore - CDN import handled by Vite
import butterchurn from "https://unpkg.com/butterchurn@3.0.0-beta.5/dist/butterchurn.js";

export function initVisualizer(
  w: number,
  h: number,
  preset: any,
  canvas: HTMLCanvasElement,
  audioElement: HTMLAudioElement
) {
  console.log("initVisualizer", audioElement, canvas, preset);
  const audioContext = new AudioContext();
  const analyserNode = audioContext.createAnalyser();

  // Create media element source from the audio element
  const sourceNode = audioContext.createMediaElementSource(audioElement);

  // Connect source -> analyser -> destination for audio playback
  sourceNode.connect(analyserNode);
  analyserNode.connect(audioContext.destination);

  const visualizer = butterchurn.createVisualizer(audioContext, canvas, {
    width: w,
    height: h,
    pixelRatio: window.devicePixelRatio || 1,
    textureRatio: 1,
  });

  visualizer.loadPreset(preset, 0);
  visualizer.connectAudio(analyserNode);

  return { visualizer, audioContext, analyserNode, sourceNode };
}
