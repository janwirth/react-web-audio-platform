import { useEffect, useState, useCallback, useRef } from "react";
import { AudioItem } from "./AudioItem";
import { GlobalControls } from "./GlobalControls";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { useTrack } from "@/components/player/Player";
import { PlayerUI } from "@/components/player/PlayerUI";
import { Visualizer } from "@/components/visualizer/Visualizer";
import { Queue, useQueue } from "@/components/player/Queue";
import { ColorPalette } from "@/components/waveform";
import { decodeAudioFile } from "@/components/audio-context";
import { CoverFlow } from "@/components/CoverFlow";
import { HotkeysBar } from "@/components/HotkeysBar";
import { TableVirtualizer } from "@/components/TableVirtualizer";
import { useAudioItems } from "@/hooks";

export function InnerApp() {
  const { audioItems, allQueueItems, handleCreateQueue, baseUrl } =
    useAudioItems();

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
      const fullAudioUrl = `${baseUrl}${item.audioUrl}`;
      const audioUrlWithKey =
        reRenderKey > 0
          ? `${fullAudioUrl}?reload=${reRenderKey}`
          : fullAudioUrl;
      decodeAudioFile(audioUrlWithKey);
    });
    // Increment the key to trigger a reload with a new URL
    setReRenderKey((prev) => prev + 1);
  }, [audioItems, baseUrl, reRenderKey]);

  const onCreateQueue = useCallback(
    (startIndex: number) => {
      handleCreateQueue(startIndex, initQueue, (firstTrackUrl) => {
        shouldAutoPlayRef.current = true;
        setFirstTrackUrl(firstTrackUrl);
      });
    },
    [handleCreateQueue, initQueue]
  );

  return (
    <div className="flex flex-col gap-8 relative">
      <HotkeysBar />
      {/* Header with dark mode and visualizer toggles */}

      <div className="sticky bg-white dark:bg-black w-full top-[32px] left-0 z-10 flex gap-1 items-center transition-colors">
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
      <CoverFlow></CoverFlow>
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
              baseUrl={baseUrl}
              customPalette={customPalette}
              waveformHeight={waveformHeight}
              reRenderKey={reRenderKey}
              onQueueClick={() => onCreateQueue(index)}
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
