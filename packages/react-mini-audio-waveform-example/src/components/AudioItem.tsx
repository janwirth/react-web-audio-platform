/**
 * Example file demonstrating Waveform component usage
 */
import { useMemo } from "react";
import { getColorPalette } from "@janwirth/react-mini-audio-waveform";
import {
  Waveform,
  WaveformRenderData,
} from "@janwirth/react-mini-audio-waveform";
import type { ColorPalette } from "@janwirth/react-mini-audio-waveform";
import { useTrack } from "./Player";

interface AudioItemProps {
  title: string;
  audioUrl: string;
  baseUrl: string;
  customPalette: Partial<ColorPalette>;
  waveformHeight: number;
  reRenderKey: number;
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
  label: string;
  audioUrl: string;
  colorPalette: Partial<ColorPalette> | ColorPalette;
  cachedRenderData: WaveformRenderData | null;
  waveformHeight: number;
  onGotData?: (data: WaveformRenderData) => void;
}

function WaveformItem({
  label,
  audioUrl,
  colorPalette,
  cachedRenderData,
  waveformHeight,
  onGotData,
}: WaveformItemProps) {
  const player = useTrack(audioUrl);

  const handleWaveformClick = (percentage: number) => {
    console.log("Waveform clicked at", percentage * 100, "%");
    player.seekAndPlay(percentage);
  };

  return (
    <div className="flex items-center gap-2 group">
      <div className="font-medium min-w-[80px] text-right text-xs font-mono text-gray-500 group-hover:text-black">
        {label}
      </div>
      <div className="flex-1 relative">
        {
          <>
            {/* <div className="text-sm text-gray-500 mb-1">
              Playhead position:{" "}
              {player.playheadPosition !== null
                ? (player.playheadPosition * 100).toFixed(2)
                : "0.00"}
              %
            </div> */}
            {player.playheadPosition !== null && (
              <div
                className="bg-black-500 w-[1%] min-w-0.5 h-full absolute bottom-[-10%] z-10 backdrop-invert"
                style={{ left: `${player.playheadPosition * 99}%` }}
              ></div>
            )}
          </>
        }
        <Waveform
          {...(onGotData && { onGotData })}
          onClickAtPercentage={handleWaveformClick}
          audioUrl={audioUrl}
          colorPalette={colorPalette}
          cachedRenderData={cachedRenderData}
          height={waveformHeight}
        />
      </div>
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
    <div className="font-mono">
      <div className="text-sm font-medium text-gray-700">{title}</div>

      <div className="flex flex-col gap-1">
        <WaveformItem
          label="custom"
          audioUrl={audioUrlWithKey}
          colorPalette={customPalette}
          cachedRenderData={cachedRenderData}
          waveformHeight={waveformHeight}
          onGotData={onGotData}
        />

        {/* Other monochrome palettes */}
        {MONOCHROME_PALETTES.map((paletteName) => {
          const palette = getColorPalette(paletteName);
          return (
            <WaveformItem
              key={paletteName}
              label={getPaletteLabel(paletteName)}
              audioUrl={audioUrlWithKey}
              colorPalette={palette}
              cachedRenderData={cachedRenderData}
              waveformHeight={waveformHeight}
            />
          );
        })}
      </div>
    </div>
  );
}
