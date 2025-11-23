/**
 * Example file demonstrating Waveform component usage
 */
import { useMemo } from "react";
import { getColorPalette } from "../lib/color-palettes";
import { Waveform, WaveformRenderData } from "./Waveform";
import type { ColorPalette } from "../lib/canvas-renderer";

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
      <div className="audio-item">
        <h2 className="audio-title">{title}</h2>
        <div className="error">Invalid audio URL configuration</div>
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
    <div className="audio-item">
      <h2 className="audio-title">{title}</h2>

      <div className="waveforms-wrapper">
        {/* Custom palette - first waveform */}
        <div className="waveform-item">
          <div className="palette-label">custom</div>
          <div className="waveform-wrapper">
            <Waveform
              onGotData={onGotData}
              onClickAtPercentage={handleWaveformClick}
              audioUrl={audioUrlWithKey}
              colorPalette={customPalette}
              cachedRenderData={cachedRenderData}
              height={waveformHeight}
            />
          </div>
        </div>

        {/* Other monochrome palettes */}
        {MONOCHROME_PALETTES.map((paletteName) => {
          const palette = getColorPalette(paletteName);
          return (
            <div key={paletteName} className="waveform-item">
              <div className="palette-label">
                {getPaletteLabel(paletteName)}
              </div>
              <div className="waveform-wrapper">
                <Waveform
                  onClickAtPercentage={handleWaveformClick}
                  audioUrl={audioUrlWithKey}
                  colorPalette={palette}
                  cachedRenderData={cachedRenderData}
                  className="waveform-container"
                  style={{ width: "100%" }}
                  height={waveformHeight}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
