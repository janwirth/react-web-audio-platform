import { useEffect, useState, useCallback, useMemo } from "react";
import { AudioItem } from "./components/AudioItem";
import { AudioContextProvider } from "./context/AudioContextProvider";
import { dequeueAudioBufferRequest } from "./hooks/useAudioBuffer";
import { generateOklchPalette } from "./lib/color-palettes";

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
      <div className="container">
        <h1>Waveform - Spectral Analysis</h1>
        <div className="loading">Loading audio items...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <h1>Waveform - Spectral Analysis</h1>
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <AudioContextProvider>
      <div className="container">
        <h1>Waveform - Spectral Analysis</h1>

        {/* Global Controls */}
        <div
          className="global-controls"
          style={{
            marginBottom: "2rem",
            padding: "1rem",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        >
          <button className="render-button" onClick={handleReRender}>
            Re-render All Waveforms
          </button>

          {/* Custom OKLCH Color Controls */}
          <div className="custom-color-controls" style={{ marginTop: "1rem" }}>
            <h3 className="custom-color-title">Custom Color Scheme</h3>
            <div className="color-control-group">
              <label className="color-control-label">
                Hue: {Math.round(customHue)}°
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={customHue}
                  onChange={(e) => setCustomHue(Number(e.target.value))}
                  className="color-slider"
                />
              </label>
              <label className="color-control-label">
                Saturation: {customSaturation.toFixed(2)}
                <input
                  type="range"
                  min="0"
                  max="0.4"
                  step="0.01"
                  value={customSaturation}
                  onChange={(e) => setCustomSaturation(Number(e.target.value))}
                  className="color-slider"
                />
              </label>
              <label className="color-control-label">
                Hue Spread: {Math.round(hueSpread)}°
                <input
                  type="range"
                  min="0"
                  max="180"
                  value={hueSpread}
                  onChange={(e) => setHueSpread(Number(e.target.value))}
                  className="color-slider"
                />
              </label>
              <label className="color-control-label">
                Contrast: {contrast.toFixed(2)}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="color-slider"
                />
              </label>
            </div>
          </div>

          {/* Waveform Height Control */}
          <div
            className="waveform-height-controls"
            style={{ marginTop: "1rem" }}
          >
            <label className="waveform-height-label">
              Waveform Height: {waveformHeight}px
              <input
                type="range"
                min="16"
                max="128"
                value={waveformHeight}
                onChange={(e) => setWaveformHeight(Number(e.target.value))}
                className="color-slider"
              />
            </label>
          </div>
        </div>

        <div className="audio-list">
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
