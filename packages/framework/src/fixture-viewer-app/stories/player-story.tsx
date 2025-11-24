import { Column } from "@/components/Column";
import { Player } from "@/components/player/Player";
import { PlayerUI } from "@/components/player/PlayerUI";
import { WaveformWithPlayhead } from "@/components/waveform/WaveformWithPlayhead";
import type { QueueItem } from "@/components/player/Player";

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

export default function PlayerStory() {
  return (
    <Player>
      <Column className="h-full w-full p-8 gap-6" style={{ height: "100%" }}>
        <div className="mb-4">
          <h1 className="text-xl font-bold mb-2">Player Story</h1>
          <p className="text-sm opacity-70">
            Demonstrates Player, PlayerUI, and WaveformWithPlayhead components
          </p>
        </div>

        {/* Player Controls */}
        <div className="w-full">
          <h2 className="text-sm font-bold mb-2">Player Controls</h2>
          <PlayerUI />
        </div>

        {/* Waveform Examples */}
        <div className="flex-1 flex flex-col gap-4" style={{ minHeight: 0 }}>
          <h2 className="text-sm font-bold">Waveform Examples</h2>
          <div className="flex-1 overflow-y-auto space-y-4">
            {audioItems.slice(0, 10).map((item) => (
              <div key={item.id} className="space-y-2">
                <div className="text-xs font-mono opacity-70">
                  {item.title}
                </div>
                <div className="h-24">
                  <WaveformWithPlayhead
                    url={item.audioUrl}
                    allItems={audioItems}
                    height={96}
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

