import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { AudioItem } from "./AudioItem";
import { GlobalControls } from "./GlobalControls";
import { DarkModeToggle } from "./DarkModeToggle";
import { type QueueItem, useTrack } from "../player/Player";
import { PlayerUI } from "../player/PlayerUI";
import { Visualizer } from "../visualizer/Visualizer";
import { Queue, useQueue } from "../player/Queue";
import { ColorPalette } from "@janwirth/react-mini-audio-waveform";
import { decodeAudioFile } from "../audio-context";

interface AudioItemData {
  title: string;
  audioUrl: string;
}

const API_URL = "http://localhost:3001/api/audio-items";
const BASE_URL = "http://localhost:3001";

export function InnerApp() {
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
  const { initQueue } = useQueue();
  const [firstTrackUrl, setFirstTrackUrl] = useState<string>("");
  const shouldAutoPlayRef = useRef(false);

  // Convert audioItems to QueueItem format for useTrack
  const allQueueItems = useMemo<QueueItem[]>(() => {
    return audioItems.map((item) => ({
      title: item.title,
      audioUrl: `${BASE_URL}${item.audioUrl}`,
    }));
  }, [audioItems]);

  const { seekAndPlay } = useTrack(firstTrackUrl || "", allQueueItems);

  // Auto-play when firstTrackUrl changes and we should auto-play
  useEffect(() => {
    if (firstTrackUrl && shouldAutoPlayRef.current) {
      seekAndPlay(0);
      shouldAutoPlayRef.current = false;
    }
  }, [firstTrackUrl, seekAndPlay]);

  const handleReRender = useCallback(() => {
    // Clear cache for all audio items
    audioItems.forEach((item) => {
      const fullAudioUrl = `${BASE_URL}${item.audioUrl}`;
      const audioUrlWithKey =
        reRenderKey > 0
          ? `${fullAudioUrl}?reload=${reRenderKey}`
          : fullAudioUrl;
      decodeAudioFile(audioUrlWithKey);
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

      initQueue(queueItems);

      // Start playing the first track in the queue at position 0
      if (queueItems.length > 0) {
        const firstTrackUrl = queueItems[0].audioUrl;
        shouldAutoPlayRef.current = true;
        setFirstTrackUrl(firstTrackUrl);
      }
    },
    [audioItems, initQueue]
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
    <div className="flex flex-col gap-8 relative">
      {/* Header with dark mode and visualizer toggles */}

      <div className="sticky bg-white dark:bg-black w-full top-0 left-0 z-10 flex gap-1 items-center transition-colors">
        {/* must take full width */}
        <div className="flex-1 grow">
          <PlayerUI />
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <DarkModeToggle />
        <button
          onClick={() => setShowVisualizer(!showVisualizer)}
          className="text-xs font-mono text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 flex items-center gap-1 cursor-pointer transition-colors"
          aria-label={showVisualizer ? "Hide visualizer" : "Show visualizer"}
        >
          {showVisualizer ? "Hide Visualizer" : "Show Visualizer"}
        </button>
      </div>
      {showVisualizer && <Visualizer />}
      <GlobalControls
        onPaletteChange={setCustomPalette}
        onHeightChange={setWaveformHeight}
        onReRender={handleReRender}
      />

      <div className="flex gap-8 items-start">
        <div className="flex-1">
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
              allItems={allQueueItems}
            />
          ))}
        </div>
        <div className="w-80 shrink-0">
          <Queue />
        </div>
      </div>
    </div>
  );
}
