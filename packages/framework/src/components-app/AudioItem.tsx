/**
 * Example file demonstrating Waveform component usage
 */
import { useMemo } from "react";
import {
  WaveformRenderData,
  WaveformWithPlayhead,
} from "@/components/waveform";
import type { ColorPalette } from "@/components/waveform";
import type { QueueItem } from "@/components/player/Player";

interface AudioItemProps {
  title: string;
  audioUrl: string;
  baseUrl: string;
  customPalette: Partial<ColorPalette>;
  waveformHeight: number;
  reRenderKey: number;
  onQueueClick?: () => void;
  allItems?: QueueItem[];
}

const MONOCHROME_PALETTES = [
  "monochrome",
  "monochrome-dark",
  "monochrome-light",
  "monochrome-inverted",
  "monochrome-blue-tint",
  "monochrome-warm",
  "monochrome-cool",
  "monochrome-charcoal",
];

interface WaveformItemProps {
  label?: string;
  audioUrl: string;
  colorPalette: Partial<ColorPalette> | ColorPalette;
  cachedRenderData: WaveformRenderData | null;
  waveformHeight: number;
  onGotData?: (data: WaveformRenderData) => void;
  allItems?: QueueItem[];
}

function WaveformItem({
  label,
  audioUrl,
  colorPalette,
  cachedRenderData,
  waveformHeight,
  onGotData,
  allItems,
}: WaveformItemProps) {
  return (
    <div className="flex items-center gap-2 group">
      {label && (
        <div className="font-medium min-w-[80px] text-right text-xs font-mono text-gray-500 group-hover:text-black">
          {label}
        </div>
      )}
      <WaveformWithPlayhead
        url={audioUrl}
        colorPalette={colorPalette}
        cachedRenderData={cachedRenderData}
        height={waveformHeight}
        onGotData={onGotData}
        allItems={allItems}
      />
    </div>
  );
}

export function AudioItem({
  title,
  audioUrl,
  baseUrl,
  customPalette,
  waveformHeight,
  reRenderKey,
  onQueueClick,
  allItems,
}: AudioItemProps) {
  console.log("rendering audio item", audioUrl);
  const fullAudioUrl = `${baseUrl}${audioUrl}`;
  // Use the audio buffer hook with reload key to force re-fetch when needed
  const audioUrlWithKey = useMemo(() => {
    return reRenderKey > 0
      ? `${fullAudioUrl}?reload=${reRenderKey}`
      : fullAudioUrl;
  }, [fullAudioUrl, reRenderKey]);

  const getPaletteLabel = (paletteName: string) => {
    return paletteName
      .replace("monochrome-", "")
      .replace("monochrome", "default");
  };

  if (!audioUrlWithKey) {
    return (
      <div className="font-mono">
        <h2 className="font-bold">{title}</h2>
        <div className="text-red-600">Invalid audio URL configuration</div>
      </div>
    );
  }

  const cachedData = localStorage.getItem(
    `waveform-data-${title}-${audioUrlWithKey}`
  );
  let cachedRenderData: WaveformRenderData | null = null;
  if (cachedData) {
    try {
      const parsed = JSON.parse(cachedData);
      // Only accept valid WaveformRenderData format, discard old formats
      if (
        parsed &&
        Array.isArray(parsed.waveformData) &&
        Array.isArray(parsed.spectralData)
      ) {
        cachedRenderData = parsed;
      }
    } catch (e) {
      // Invalid cache data, ignore
      console.warn("Failed to parse cached waveform data:", e);
    }
  }
  const onGotData = (data: WaveformRenderData) => {
    localStorage.setItem(
      `waveform-data-${title}-${audioUrlWithKey}`,
      JSON.stringify(data)
    );
  };

  return (
    <WaveformItem
      audioUrl={audioUrlWithKey}
      colorPalette={customPalette}
      cachedRenderData={cachedRenderData}
      waveformHeight={waveformHeight}
      onGotData={onGotData}
      allItems={allItems}
    />
  );
}
