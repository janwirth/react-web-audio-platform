import type { Meta, StoryObj } from '@storybook/react';
import { useMemo } from 'react';
import { Column } from '@/components/Column';
import { Player } from '@/components/player/Player';
import { PlayerUI } from '@/components/player/PlayerUI';
import { WaveformWithPlayhead } from '@/components/waveform/WaveformWithPlayhead';
import type { QueueItem } from '@/components/player/Player';
import { useColorScheme } from '@/hooks/useColorScheme';
import { COLOR_PALETTES } from '@/components/waveform/lib/color-palettes';

const audioItems: QueueItem[] = [
  {
    id: '1',
    title: 'Sample Track 1',
    audioUrl: 'http://localhost:3001/audio/track1.mp3',
    coverUrl:
      'https://www.vinylnerds.de/media/image/68/98/fc/4080_1_600x600.jpg',
  },
  {
    id: '2',
    title: 'Sample Track 2',
    audioUrl: 'http://localhost:3001/audio/track2.mp3',
    coverUrl:
      'https://www.vinylnerds.de/media/image/68/98/fc/4080_1_600x600.jpg',
  },
  {
    id: '3',
    title: 'Sample Track 3',
    audioUrl: 'http://localhost:3001/audio/track3.mp3',
    coverUrl:
      'https://www.vinylnerds.de/media/image/68/98/fc/4080_1_600x600.jpg',
  },
  ...Array.from({ length: 100 }, (_, i) => ({
    id: `${i + 4}`,
    title: `Sample Track ${i + 4}`,
    audioUrl: `http://localhost:3001/audio/track${i + 4}.mp3`,
    coverUrl:
      'https://www.vinylnerds.de/media/image/68/98/fc/4080_1_600x600.jpg',
  })),
];

function PlayerStory() {
  const { isDark } = useColorScheme();

  // Use theme-appropriate color palette
  const colorPalette = useMemo(() => {
    return isDark
      ? COLOR_PALETTES['monochrome-dark']
      : COLOR_PALETTES['monochrome-light'];
  }, [isDark]);

  return (
    <Player>
      <Column className="h-full w-full p-8 gap-6" style={{ height: '100vh' }}>
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

        {/* Waveform Examples */}
        <div className="flex-1 flex flex-col gap-4" style={{ minHeight: 0 }}>
          <h2 className="text-sm font-bold text-black dark:text-white">
            Waveform Examples
          </h2>
          <div className="flex-1 overflow-y-auto space-y-4">
            {audioItems.slice(0, 10).map((item) => (
              <div key={item.id} className="space-y-2">
                <div className="text-xs font-mono opacity-70 text-gray-600 dark:text-gray-400">
                  {item.title}
                </div>
                <div className="h-24">
                  <WaveformWithPlayhead
                    url={item.audioUrl}
                    allItems={audioItems}
                    height={96}
                    colorPalette={colorPalette}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Column>
    </Player>
  );
}

const meta = {
  title: 'Stories/PlayerStory',
  component: PlayerStory,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PlayerStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

