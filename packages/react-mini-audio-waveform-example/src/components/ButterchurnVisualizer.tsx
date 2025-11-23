import butterchurn from "butterchurn";
import butterchurnPresets from "butterchurn-presets";
import { usePlayerContext } from "./Player";
import { useRef } from "react";
import { useEffect } from "react";
export const ButterchurnVisualizer = () => {
  const playerContext = usePlayerContext();
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvas.current) {
      if (!playerContext.audioRef.current) return;
      const ctx = getAudioContext(playerContext.audioRef.current);
      console.log(ctx);
      const visualizer = butterchurn.createVisualizer(ctx, canvas.current, {
        width: 800,
        height: 600,
      });
      console.log(visualizer);

      visualizer.loadPreset(preset, 0.0); // 2nd argument is the number of seconds to blend presets

      // resize visualizer

      visualizer.setRendererSize(1600, 1200);

      // render a frame

      visualizer.render();
    }
  }, [playerContext.audioRef.current]);
  return <canvas ref={canvas} />;
};

const getAudioContext = (audioElement: HTMLAudioElement) => {
  const ctx = new AudioContext();
  const source = ctx.createMediaElementSource(audioElement); // AudioNode
  source.connect(ctx.destination);
  return ctx;
};

// load a preset

const presets = butterchurnPresets.getPresets();
const preset =
  presets["Flexi, martin + geiss - dedicated to the sherwin maxawow"];
