import {
  Waveform,
  WaveformRenderData,
} from "@janwirth/react-mini-audio-waveform";
import type { ColorPalette } from "@janwirth/react-mini-audio-waveform";

interface ThemeExampleProps {
  label: string;
  audioUrl: string;
  colorPalette: ColorPalette | Partial<ColorPalette>;
  cachedRenderData: WaveformRenderData | null;
  height: number;
  onClickAtPercentage: (percentage: number) => void;
  onGotData?: (data: WaveformRenderData) => void;
}

export function ThemeExample({
  label,
  audioUrl,
  colorPalette,
  cachedRenderData,
  height,
  onClickAtPercentage,
  onGotData,
}: ThemeExampleProps) {
  return (
    <div className="flex items-center gap-4 min-w-[128px] max-w-[512px] grow">
      <div className="w-16 text-right font-mono text-xs text-gray-500">
        {label}
      </div>
      <div className="flex-1 min-w-0">
        <Waveform
          onGotData={onGotData}
          onClickAtPercentage={onClickAtPercentage}
          audioUrl={audioUrl}
          colorPalette={colorPalette}
          cachedRenderData={cachedRenderData}
          height={height}
        />
      </div>
    </div>
  );
}
