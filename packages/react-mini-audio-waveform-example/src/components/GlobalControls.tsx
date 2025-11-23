import { useState, useMemo, useCallback, useEffect } from "react";
import { ColorPicker } from "./ColorPicker";
import { VerticalSlider } from "./VerticalSlider";
import { generateOklchPalette } from "@janwirth/react-mini-audio-waveform";
import type { ColorPalette } from "@janwirth/react-mini-audio-waveform";

interface GlobalControlsProps {
  onPaletteChange: (palette: Partial<ColorPalette>) => void;
  onHeightChange: (height: number) => void;
  onReRender: () => void;
}

export function GlobalControls({
  onPaletteChange,
  onHeightChange,
  onReRender,
}: GlobalControlsProps) {
  // Custom OKLCH color scheme controls
  const [customHue, setCustomHue] = useState(240); // Default blue hue
  const [customSaturation, setCustomSaturation] = useState(0.2); // Default saturation
  const [hueSpread, setHueSpread] = useState(60); // Default hue spread in degrees
  const [contrast, setContrast] = useState(0.4); // Default contrast (0-1)

  // Waveform height control
  const [waveformHeight, setWaveformHeight] = useState(32); // Default height

  // Generate custom OKLCH palette
  const customPalette = useMemo(
    () =>
      generateOklchPalette(customHue, customSaturation, hueSpread, contrast),
    [customHue, customSaturation, hueSpread, contrast]
  );

  // Notify parent when palette changes
  useEffect(() => {
    onPaletteChange(customPalette);
  }, [customPalette, onPaletteChange]);

  // Notify parent when height changes
  const handleHeightChange = useCallback(
    (height: number) => {
      setWaveformHeight(height);
      onHeightChange(height);
    },
    [onHeightChange]
  );

  return (
    <div className="flex flex-row items-end gap-8">
      {/* Global Controls */}
      <div className="flex flex-row items-end gap-8">
        {/* Custom OKLCH Color Controls */}
        <ColorPicker
          hue={customHue}
          saturation={customSaturation}
          hueSpread={hueSpread}
          contrast={contrast}
          onHueChange={setCustomHue}
          onSaturationChange={setCustomSaturation}
          onHueSpreadChange={setHueSpread}
          onContrastChange={setContrast}
        />
        <VerticalSlider
          label="HGT"
          value={waveformHeight}
          min={16}
          max={128}
          step={1}
          onChange={handleHeightChange}
        />
      </div>
      <button
        className="mb-8 font-mono self-start text-xs text-gray-500"
        onClick={onReRender}
      >
        Re-render All Waveforms
      </button>
    </div>
  );
}
