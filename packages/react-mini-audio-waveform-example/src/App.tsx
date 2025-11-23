import { useEffect, useState, useCallback } from "react";
import { useSetAtom } from "jotai";
import { AudioItem } from "./components/AudioItem";
import { GlobalControls } from "./components/GlobalControls";
import { AudioContextProvider } from "@janwirth/react-web-audio-context";
import { dequeueAudioBufferRequest } from "@janwirth/react-web-audio-context";
import type { ColorPalette } from "@janwirth/react-mini-audio-waveform";
import {
  Player,
  queueAtom,
  currentQueueIndexAtom,
  type QueueItem,
  activeUrlAtom,
} from "./components/Player";
import { PlayerUI } from "./components/PlayerUI";
import { Visualizer } from "./components/Visualizer";
import { MiniSpectro } from "./components/MiniSpectro";
import { Queue } from "./components/Queue";

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

  // Visualizer toggle state (default off)
  const [showVisualizer, setShowVisualizer] = useState(false);

  // Global control values
  const [customPalette, setCustomPalette] = useState<Partial<ColorPalette>>({});
  const [waveformHeight, setWaveformHeight] = useState(32);

  // Re-render key to force reload
  const [reRenderKey, setReRenderKey] = useState(0);

  // Queue management
  const setQueue = useSetAtom(queueAtom);
  const setCurrentQueueIndex = useSetAtom(currentQueueIndexAtom);
  const setActiveUrl = useSetAtom(activeUrlAtom);

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

  const handleCreateQueue = useCallback(
    (startIndex: number) => {
      // Create queue starting from the clicked track, including all subsequent tracks
      const queueItems: QueueItem[] = audioItems
        .slice(startIndex)
        .map((item) => ({
          title: item.title,
          audioUrl: `${BASE_URL}${item.audioUrl}`, // Store full URL
        }));

      setQueue(queueItems);
      setCurrentQueueIndex(0);

      // Start playing the first track in the queue
      if (queueItems.length > 0) {
        const firstTrackUrl = queueItems[0].audioUrl;
        setActiveUrl(firstTrackUrl);
        // Use the audio element to start playback
        const audioElement = document.querySelector(
          "audio"
        ) as HTMLAudioElement;
        if (audioElement) {
          audioElement.src = firstTrackUrl;
          audioElement.load();
          audioElement.play().catch(console.error);
        }
      }
    },
    [audioItems, setQueue, setCurrentQueueIndex, setActiveUrl]
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

  return (
    <AudioContextProvider>
      <Player>
        <div className="flex flex-col gap-8 relative">
          {/* Header with visualizer toggle */}
          <button
            onClick={() => setShowVisualizer(!showVisualizer)}
            className="text-xs font-mono text-gray-500 hover:text-gray-900 mb-1 flex items-center gap-1 cursor-pointer"
            aria-label={showVisualizer ? "Hide visualizer" : "Show visualizer"}
          >
            {showVisualizer ? "Hide Visualizer" : "Show Visualizer"}
          </button>
          {showVisualizer && <Visualizer />}

          <div className="sticky bg-gray-100 w-full top-[73px] left-0 z-10 flex gap-1 items-center ">
            <div className="flex-1 grow">
              <PlayerUI />
            </div>
          </div>
          <GlobalControls
            onPaletteChange={setCustomPalette}
            onHeightChange={setWaveformHeight}
            onReRender={handleReRender}
          />

          <Queue />

          {audioItems.map((item, index) => (
            <AudioItem
              key={index}
              title={item.title}
              audioUrl={item.audioUrl}
              baseUrl={BASE_URL}
              customPalette={customPalette}
              waveformHeight={waveformHeight}
              reRenderKey={reRenderKey}
              onQueueClick={() => handleCreateQueue(index)}
            />
          ))}
        </div>
      </Player>
    </AudioContextProvider>
  );
}

export default App;
