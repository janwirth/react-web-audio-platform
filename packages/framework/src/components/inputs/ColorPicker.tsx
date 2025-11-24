import { VerticalSlider } from "./VerticalSlider";

interface ColorPickerProps {
  hue: number;
  saturation: number;
  hueSpread: number;
  contrast: number;
  lightness: number;
  onHueChange: (value: number) => void;
  onSaturationChange: (value: number) => void;
  onHueSpreadChange: (value: number) => void;
  onContrastChange: (value: number) => void;
  onLightnessChange: (value: number) => void;
}

export function ColorPicker({
  hue,
  saturation,
  hueSpread,
  contrast,
  lightness,
  onHueChange,
  onSaturationChange,
  onHueSpreadChange,
  onContrastChange,
  onLightnessChange,
}: ColorPickerProps) {
  // Fade out hue and spread when saturation is very low
  const isLowSaturation = saturation < 0.1;
  const fadeOpacity = isLowSaturation ? 0.3 : 1;

  return (
    <div className="flex flex-row items-end gap-2.5">
      <VerticalSlider
        label="CTR"
        value={contrast}
        min={-1}
        max={1}
        step={0.01}
        polarity="offset"
        onChange={onContrastChange}
      />
      <VerticalSlider
        label="LGT"
        value={lightness}
        min={0.1}
        max={0.9}
        step={0.01}
        polarity="normal"
        onChange={onLightnessChange}
      />
      <VerticalSlider
        label="SAT"
        value={saturation}
        min={0}
        max={0.4}
        step={0.01}
        polarity="normal"
        onChange={onSaturationChange}
      />
      <div style={{ opacity: fadeOpacity }}>
        <VerticalSlider
          label="HUE"
          value={hue}
          min={0}
          max={360}
          polarity="offset"
          onChange={onHueChange}
        />
      </div>
      <div style={{ opacity: fadeOpacity }}>
        <VerticalSlider
          label="SPR"
          value={hueSpread}
          min={0}
          max={180}
          polarity="normal"
          onChange={onHueSpreadChange}
        />
      </div>
    </div>
  );
}
