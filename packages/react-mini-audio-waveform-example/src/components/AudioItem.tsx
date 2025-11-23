/**
 * Example file demonstrating Waveform component usage
 */
import { useMemo } from "react";
import { getColorPalette } from "@janwirth/react-mini-audio-waveform";
import { WaveformRenderData } from "@janwirth/react-mini-audio-waveform";
import type { ColorPalette } from "@janwirth/react-mini-audio-waveform";
import { ThemeExample } from "./ThemeExample";

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

export function AudioItem({
  title,
  audioUrl,
  baseUrl,
  customPalette,
  waveformHeight,
  reRenderKey,
}: AudioItemProps) {
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
      <div className="mb-8">
        <h2 className="mb-4">{title}</h2>
        <div className="my-4 text-red-600">Invalid audio URL configuration</div>
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

  const handleWaveformClick = (percentage: number) => {
    console.log("Waveform clicked at", percentage * 100, "%");
  };

  return (
    <div className="mb-8">
      <h2 className="mb-4">{title}</h2>

      <div className="flex flex-row gap-4 mt-4 flex-wrap">
        {/* Custom palette - first waveform */}
        <ThemeExample
          label="custom"
          audioUrl={audioUrlWithKey}
          colorPalette={customPalette}
          cachedRenderData={cachedRenderData}
          height={waveformHeight}
          onClickAtPercentage={handleWaveformClick}
          onGotData={onGotData}
        />

        {/* Other monochrome palettes */}
        {MONOCHROME_PALETTES.map((paletteName) => {
          const palette = getColorPalette(paletteName);
          return (
            <ThemeExample
              key={paletteName}
              label={getPaletteLabel(paletteName)}
              audioUrl={audioUrlWithKey}
              colorPalette={palette}
              cachedRenderData={cachedRenderData}
              height={waveformHeight}
              onClickAtPercentage={handleWaveformClick}
            />
          );
        })}
      </div>
    </div>
  );
}
