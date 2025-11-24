import { useState, useMemo, useCallback, useEffect } from "react";
import { ColorPicker } from "../inputs/ColorPicker";
import { VerticalSlider } from "../inputs/VerticalSlider";
import { generateOklchPalette } from "../waveform";
import type { ColorPalette } from "../waveform";
import { useColorScheme } from "../../hooks/useColorScheme";

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
  // Get dark mode state
  const { isDark } = useColorScheme();

  // Custom OKLCH color scheme controls
  const [customHue, setCustomHue] = useState(240); // Default blue hue
  const [customSaturation, setCustomSaturation] = useState(0.2); // Default saturation
  const [hueSpread, setHueSpread] = useState(60); // Default hue spread in degrees
  const [contrast, setContrast] = useState(0); // Default contrast (0 = center, -1 to 1)
  const [lightness, setLightness] = useState(0.5); // Default lightness (0-1)

  // Waveform height control
  const [waveformHeight, setWaveformHeight] = useState(32); // Default height

  // Generate custom OKLCH palette
  // In dark mode, invert the contrast value for the custom palette
  const customPalette = useMemo(
    () =>
      generateOklchPalette(
        customHue,
        customSaturation,
        hueSpread,
        isDark ? -contrast : contrast,
        lightness
      ),
    [customHue, customSaturation, hueSpread, contrast, lightness, isDark]
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
          lightness={lightness}
          onHueChange={setCustomHue}
          onSaturationChange={setCustomSaturation}
          onHueSpreadChange={setHueSpread}
          onContrastChange={setContrast}
          onLightnessChange={setLightness}
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
