import type { Meta, StoryObj } from "@storybook/react";
import { useMemo, useState } from "react";
import { Column } from "@/components/Column";
import { Player } from "@/media/player/Player";
import { PlayerUI } from "@/media/player/PlayerUI";
import { WaveformWithPlayhead } from "@/media/waveform/WaveformWithPlayhead";
import { Visualizer } from "@/components/visualizer/Visualizer";
import type { QueueItem } from "@/media/player/Player";
import { useColorScheme } from "@/hooks/useColorScheme";
import { COLOR_PALETTES } from "@/media/waveform/lib/color-palettes";
import { FPSMeter } from "@overengineering/fps-meter";
import { AudioContextProvider } from "@/media/audio-context";

const audioItems: QueueItem[] = [
  {
    id: "1",
    title: "Sample Track 1",
    audioUrl: "http://localhost:3001/audio/track1.mp3",
    coverUrl:
      "https://www.vinylnerds.de/media/image/68/98/fc/4080_1_600x600.jpg",
  },
  {
    id: "2",
    title: "Sample Track 2",
    audioUrl: "http://localhost:3001/audio/track2.mp3",
    coverUrl:
      "https://www.vinylnerds.de/media/image/68/98/fc/4080_1_600x600.jpg",
  },
  {
    id: "3",
    title: "Sample Track 3",
    audioUrl: "http://localhost:3001/audio/track3.mp3",
    coverUrl:
      "https://www.vinylnerds.de/media/image/68/98/fc/4080_1_600x600.jpg",
  },
  ...Array.from({ length: 100 }, (_, i) => ({
    id: `${i + 4}`,
    title: `Sample Track ${i + 4}`,
    audioUrl: `http://localhost:3001/audio/track${i + 4}.mp3`,
    coverUrl:
      "https://www.vinylnerds.de/media/image/68/98/fc/4080_1_600x600.jpg",
  })),
];

function PlayerStory() {
  const { isDark } = useColorScheme();
  const [showVisualizer, setShowVisualizer] = useState(true);

  // Use theme-appropriate color palette
  const colorPalette = useMemo(() => {
    return isDark
      ? COLOR_PALETTES["monochrome-dark"]
      : COLOR_PALETTES["monochrome-light"];
  }, [isDark]);

  return (
    <Player>
      <Column className="h-full w-full p-8 gap-6" style={{ height: "100vh" }}>
        <FPSMeter></FPSMeter>
        <div className="mb-4">
          <h1 className="text-xl font-bold mb-2 text-black dark:text-white">
            Player Story
          </h1>
          <p className="text-sm opacity-70 text-gray-600 dark:text-gray-400">
            Demonstrates Player, PlayerUI, and WaveformWithPlayhead components
          </p>
        </div>

        {/* Player Controls */}
        <div className="w-full">
          <h2 className="text-sm font-bold mb-2 text-black dark:text-white">
            Player Controls
          </h2>
          <PlayerUI />
        </div>

        {/* Visualizer */}
        {showVisualizer && (
          <Column className="w-full h-64 flex-1 gap-2" style={{ minHeight: 0 }}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-black dark:text-white">
                Visualizer
              </h2>
              <button
                onClick={() => setShowVisualizer(!showVisualizer)}
                className="text-xs font-mono hover:opacity-60 transition-opacity text-gray-600 dark:text-gray-400"
              >
                Hide
              </button>
            </div>
            <Column className="flex-1" style={{ minHeight: 0 }}>
              <Visualizer />
            </Column>
          </Column>
        )}
        {!showVisualizer && (
          <div className="w-full">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-black dark:text-white">
                Visualizer
              </h2>
              <button
                onClick={() => setShowVisualizer(!showVisualizer)}
                className="text-xs font-mono hover:opacity-60 transition-opacity text-gray-600 dark:text-gray-400"
              >
                Show
              </button>
            </div>
          </div>
        )}

        {/* Waveform Examples */}
        <div className="flex-1 flex flex-col gap-4" style={{ minHeight: 0 }}>
          <h2 className="text-sm font-bold text-black dark:text-white">
            Waveform Examples
          </h2>
          <div className="flex-1 overflow-y-auto">
            {audioItems
              .slice(0, 3)
              .filter((item) => item.audioUrl)
              .map((item) => (
                <div key={item.id} className="space-y-2">
                  <div className="text-xs font-mono opacity-70 text-gray-600 dark:text-gray-400">
                    {item.title}
                  </div>
                  <WaveformWithPlayhead
                    url={item.audioUrl!}
                    allItems={audioItems}
                    height={24}
                    colorPalette={colorPalette}
                  />
                </div>
              ))}
          </div>
        </div>
      </Column>
    </Player>
  );
}

const meta = {
  title: "Stories/PlayerStory",
  component: PlayerStory,
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
} satisfies Meta<typeof PlayerStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
