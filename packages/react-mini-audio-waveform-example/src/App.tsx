import { useEffect, useState, useCallback, useMemo } from "react";
import { AudioItem } from "./components/AudioItem";
import { ColorPicker } from "./components/ColorPicker";
import { AudioContextProvider } from "@janwirth/react-web-audio-context";
import { dequeueAudioBufferRequest } from "@janwirth/react-web-audio-context";
import { generateOklchPalette } from "@janwirth/react-mini-audio-waveform";
import { VerticalSlider } from "./components/VerticalSlider";

interface AudioItemData {
  title: string;
  audioUrl: string;
}

const API_URL = "http://localhost:3001/api/audio-items";
const BASE_URL = "http://localhost:3001";

function App() {
  const [audioItems, setAudioItems] = useState<AudioItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Custom OKLCH color scheme controls
  const [customHue, setCustomHue] = useState(240); // Default blue hue
  const [customSaturation, setCustomSaturation] = useState(0.2); // Default saturation
  const [hueSpread, setHueSpread] = useState(60); // Default hue spread in degrees
  const [contrast, setContrast] = useState(0.4); // Default contrast (0-1)

  // Waveform height control
  const [waveformHeight, setWaveformHeight] = useState(32); // Default height

  // Re-render key to force reload
  const [reRenderKey, setReRenderKey] = useState(0);

  const handleReRender = useCallback(() => {
    // Clear cache for all audio items
    audioItems.forEach((item) => {
      const fullAudioUrl = `${BASE_URL}${item.audioUrl}`;
      const audioUrlWithKey =
        reRenderKey > 0
          ? `${fullAudioUrl}?reload=${reRenderKey}`
          : fullAudioUrl;
      dequeueAudioBufferRequest(audioUrlWithKey);
    });
    // Increment the key to trigger a reload with a new URL
    setReRenderKey((prev) => prev + 1);
  }, [audioItems, reRenderKey]);

  // Generate custom OKLCH palette
  const customPalette = useMemo(
    () =>
      generateOklchPalette(customHue, customSaturation, hueSpread, contrast),
    [customHue, customSaturation, hueSpread, contrast]
  );

  useEffect(() => {
    const fetchAudioItems = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();
        setAudioItems(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      }
    };

    fetchAudioItems();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto">
        <h1 className="mb-8">Waveform - Spectral Analysis</h1>
        <div className="my-8">Loading audio items...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto">
        <h1 className="mb-8">Waveform - Spectral Analysis</h1>
        <div className="my-4 text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <AudioContextProvider>
      <div className="mx-auto">
        <h1 className="mb-8">Waveform - Spectral Analysis</h1>

        {/* Global Controls */}
        <div className="flex flex-row items-end gap-8">
          {/* <button className="" onClick={handleReRender}>
            Re-render All Waveforms
          </button> */}

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
            onChange={setWaveformHeight}
          />
        </div>

        <div>
          {audioItems.map((item, index) => (
            <AudioItem
              key={index}
              title={item.title}
              audioUrl={item.audioUrl}
              baseUrl={BASE_URL}
              customPalette={customPalette}
              waveformHeight={waveformHeight}
              reRenderKey={reRenderKey}
            />
          ))}
        </div>
      </div>
    </AudioContextProvider>
  );
}

export default App;
