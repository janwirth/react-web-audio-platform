// @ts-ignore - CDN import handled by Vite
import butterchurn from "https://unpkg.com/butterchurn@3.0.0-beta.5/dist/butterchurn.js";

export function initVisualizer(
  w: number,
  h: number,
  preset: any,
  canvas: HTMLCanvasElement,
  audioElement: HTMLAudioElement
) {
  const audioContext = new AudioContext();
  const analyserNode = audioContext.createAnalyser();

  // Try to create media element source from the audio element
  // Note: Only one MediaElementAudioSourceNode can exist per audio element
  // If another component (like MiniSpectro) already created one, this will fail
  let sourceNode: MediaElementAudioSourceNode | null = null;
  try {
    sourceNode = audioContext.createMediaElementSource(audioElement);
    // Connect source -> analyser for analysis
    sourceNode.connect(analyserNode);
    // DO NOT connect analyser to destination - this would create a parallel audio path
    // and increase volume. The audio element's output is handled by other components
    // (e.g., MiniSpectro) or the audio element's default output if no other component
    // has created a source node yet.
  } catch (error) {
    // Another component already created a source node from this audio element
    // We can't create another one, so visualization won't work
    console.warn(
      "Could not create MediaElementAudioSourceNode (may already exist):",
      error
    );
    // Return early - we can't visualize without a source node
    return null;
  }

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
