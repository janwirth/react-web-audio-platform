import type { Meta, StoryObj } from "@storybook/react";
import { AudioContextProvider } from "@/media/audio-context";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Column } from "@/components/Column";
import { Waveform } from "@/media/waveform";
import { ColorPicker } from "@/ui/inputs/ColorPicker";
import { VerticalSlider } from "@/ui/inputs/VerticalSlider";
import { generateOklchPalette, type ColorPalette } from "@/media/waveform";
import { useColorScheme } from "@/hooks/useColorScheme";

const STORAGE_KEY_PREFIX = "waveform-controls-story-";

// Default values matching GlobalControls
const DEFAULT_HUE = 240;
const DEFAULT_SATURATION = 0.2;
const DEFAULT_HUE_SPREAD = 60;
const DEFAULT_CONTRAST = 0;
const DEFAULT_LIGHTNESS = 0.5;
const DEFAULT_HEIGHT = 32;

// Helper functions for localStorage
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") return defaultValue;
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`);
    if (stored !== null) {
      return JSON.parse(stored) as T;
    }
  } catch (e) {
    console.warn(`Failed to load ${key} from localStorage:`, e);
  }
  return defaultValue;
};

const saveToStorage = <T,>(key: string, value: T): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${key}`, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to save ${key} to localStorage:`, e);
  }
};

const audioUrls = [
  "http://localhost:3001/audio/track1.mp3",
  "http://localhost:3001/audio/track2.mp3",
  "http://localhost:3001/audio/track3.mp3",
];

function WaveformControlsStory() {
  const { isDark } = useColorScheme();

  // Load initial values from localStorage or use defaults
  const [hue, setHue] = useState(() => loadFromStorage("hue", DEFAULT_HUE));
  const [saturation, setSaturation] = useState(() =>
    loadFromStorage("saturation", DEFAULT_SATURATION)
  );
  const [hueSpread, setHueSpread] = useState(() =>
    loadFromStorage("hueSpread", DEFAULT_HUE_SPREAD)
  );
  const [contrast, setContrast] = useState(() =>
    loadFromStorage("contrast", DEFAULT_CONTRAST)
  );
  const [lightness, setLightness] = useState(() =>
    loadFromStorage("lightness", DEFAULT_LIGHTNESS)
  );
  const [waveformHeight, setWaveformHeight] = useState(() =>
    loadFromStorage("height", DEFAULT_HEIGHT)
  );

  // Save to localStorage whenever values change
  useEffect(() => {
    saveToStorage("hue", hue);
  }, [hue]);

  useEffect(() => {
    saveToStorage("saturation", saturation);
  }, [saturation]);

  useEffect(() => {
    saveToStorage("hueSpread", hueSpread);
  }, [hueSpread]);

  useEffect(() => {
    saveToStorage("contrast", contrast);
  }, [contrast]);

  useEffect(() => {
    saveToStorage("lightness", lightness);
  }, [lightness]);

  useEffect(() => {
    saveToStorage("height", waveformHeight);
  }, [waveformHeight]);

  // Generate custom OKLCH palette
  // In dark mode, invert the contrast value for the custom palette
  const colorPalette = useMemo<ColorPalette>(
    () =>
      generateOklchPalette(
        hue,
        saturation,
        hueSpread,
        isDark ? -contrast : contrast,
        lightness
      ),
    [hue, saturation, hueSpread, contrast, lightness, isDark]
  );

  const handleHeightChange = useCallback((height: number) => {
    setWaveformHeight(height);
  }, []);

  return (
    <Column className="h-full w-full p-8 gap-6" style={{ height: "100vh" }}>
      <div className="mb-4">
        <h1 className="text-xl font-bold mb-2 text-black dark:text-white">
          Waveform Controls Story
        </h1>
        <p className="text-sm opacity-70 text-gray-600 dark:text-gray-400">
          Customize waveform colors and height with controls that persist to
          localStorage
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-row items-end gap-8">
        <ColorPicker
          hue={hue}
          saturation={saturation}
          hueSpread={hueSpread}
          contrast={contrast}
          lightness={lightness}
          onHueChange={setHue}
          onSaturationChange={setSaturation}
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

      {/* Waveform Examples */}
      <div className="flex-1 flex flex-col gap-4" style={{ minHeight: 0 }}>
        <h2 className="text-sm font-bold text-black dark:text-white">
          Waveform Examples
        </h2>
        <div className="flex-1 overflow-y-auto space-y-4">
          {audioUrls.map((url, index) => (
            <div key={index} className="space-y-2">
              <div className="text-xs font-mono opacity-70 text-gray-600 dark:text-gray-400">
                Track {index + 1}
              </div>
              <div style={{ height: `${waveformHeight}px` }}>
                <Waveform
                  audioUrl={url}
                  height={waveformHeight}
                  colorPalette={colorPalette}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Column>
  );
}

const meta = {
  title: "Stories/WaveformControlsStory",
  component: WaveformControlsStory,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <AudioContextProvider>
        <Story />
      </AudioContextProvider>
    ),
  ],
} satisfies Meta<typeof WaveformControlsStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
