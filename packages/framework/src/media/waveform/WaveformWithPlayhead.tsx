import { Waveform } from "./Waveform";
import type { WaveformRenderData } from "./hooks/useWaveformRenderData";
import type { ColorPalette } from "./lib/canvas-renderer";
import { useTrack, type QueueItem } from "@/media/player/Player";

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
    <div className="flex-1 relative cursor-pointer">
      {player.playheadPosition !== null && (
        <div
          className="w-[1%] min-w-0.5 h-full absolute bottom-[-10%] z-10 transition-all dark:bg-red-500/5 backdrop-invert-100 bg-black/10 pointer-events-none"
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
      <div className="h-0.25 bg-gray-500 w-full"></div>
    </div>
  );
}
