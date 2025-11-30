import { Waveform, WaveformRenderData } from "./Waveform";
import type { ColorPalette } from "./lib/canvas-renderer";
import { useTrack, type QueueItem } from "@/components/player/Player";

interface WaveformWithPlayheadProps {
  url: string;
  colorPalette?: Partial<ColorPalette> | ColorPalette;
  cachedRenderData?: WaveformRenderData | null;
  height?: number;
  onGotData?: (data: WaveformRenderData) => void;
  allItems?: QueueItem[];
  onClickAtPercentage?: (percentage: number) => void;
}

export function WaveformWithPlayhead({
  url,
  colorPalette,
  cachedRenderData,
  height,
  onGotData,
  allItems,
  onClickAtPercentage,
}: WaveformWithPlayheadProps) {
  const player = useTrack(url, allItems);

  const handleWaveformClick = (percentage: number) => {
    player.seekAndPlay(percentage);
    onClickAtPercentage?.(percentage);
  };

  return (
    <div className="flex-1 relative">
      {player.playheadPosition !== null && (
        <div
          className="w-[1%] min-w-0.5 h-full absolute bottom-[-10%] z-10 transition-all dark:bg-white/10 backdrop-invert-100 bg-black/10"
          style={{ width: `${player.playheadPosition * 100}%` }}
        ></div>
      )}
      <Waveform
        {...(onGotData && { onGotData })}
        onClickAtPercentage={handleWaveformClick}
        audioUrl={url}
        colorPalette={colorPalette}
        cachedRenderData={cachedRenderData}
        height={height}
        className="cursor-pointer"
      />
    </div>
  );
}
