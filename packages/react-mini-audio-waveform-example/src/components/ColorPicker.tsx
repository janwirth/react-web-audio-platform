import { VerticalSlider } from "./VerticalSlider";

interface ColorPickerProps {
  hue: number;
  saturation: number;
  hueSpread: number;
  contrast: number;
  onHueChange: (value: number) => void;
  onSaturationChange: (value: number) => void;
  onHueSpreadChange: (value: number) => void;
  onContrastChange: (value: number) => void;
}

export function ColorPicker({
  hue,
  saturation,
  hueSpread,
  contrast,
  onHueChange,
  onSaturationChange,
  onHueSpreadChange,
  onContrastChange,
}: ColorPickerProps) {
  // Fade out hue and spread when saturation is very low
  const isLowSaturation = saturation < 0.1;
  const fadeOpacity = isLowSaturation ? 0.3 : 1;

  return (
    <div className="mt-4">
      <div className="flex flex-row items-end gap-2.5">
        <VerticalSlider
          label="CTR"
          value={contrast}
          min={0}
          max={1}
          step={0.01}
          polarity="normal"
          onChange={onContrastChange}
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
    </div>
  );
}
