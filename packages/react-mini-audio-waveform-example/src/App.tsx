import { useEffect, useState, useCallback } from "react";
import { AudioItem } from "./components/AudioItem";
import { GlobalControls } from "./components/GlobalControls";
import { AudioContextProvider } from "@janwirth/react-web-audio-context";
import { dequeueAudioBufferRequest } from "@janwirth/react-web-audio-context";
import type { ColorPalette } from "@janwirth/react-mini-audio-waveform";
import { Player } from "./components/Player";

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

  // Global control values
  const [customPalette, setCustomPalette] = useState<Partial<ColorPalette>>({});
  const [waveformHeight, setWaveformHeight] = useState(32);

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

  return (
    <AudioContextProvider>
      <Player>
        <div className="flex flex-col gap-8">
          <GlobalControls
            onPaletteChange={setCustomPalette}
            onHeightChange={setWaveformHeight}
            onReRender={handleReRender}
          />

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
      </Player>
    </AudioContextProvider>
  );
}

export default App;
