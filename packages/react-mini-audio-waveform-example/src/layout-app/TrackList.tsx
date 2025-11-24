import { Waveform } from "@/components/waveform";
import { DualViewListItem } from "../components/DualViewList";

// Generate dual view list items data
const generateDualViewListItems = (count: number = 350): DualViewListItem[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: `Item ${i + 1}`,
    name: `Item ${i + 1}`,
    description: `This is item number ${i + 1} in the virtualized list`,
    coverUrl:
      i % 2 === 0
        ? "https://i.scdn.co/image/ab67616d00001e02d9194aa18fa4c9362b47464f"
        : null,
    audioUrl: `/audio/track${(i % 3) + 1}.mp3`,
  }));
};

export const tracklist = generateDualViewListItems(350);

export function viewTrackListItem(
  item: DualViewListItem,
  _index: number,
  isSelected: boolean
) {
  return (
    <div
      className="dark:border-gray-800 hover:opacity-60 transition-opacity font-mono text-sm relative flex items-center gap-2"
      style={{
        backgroundColor: isSelected
          ? "rgba(128, 128, 128, 0.15)"
          : "transparent",
      }}
    >
      {isSelected && (
        <div
          className="w-1.5 h-1.5 rounded-full absolute -left-2"
          style={{
            backgroundColor: "currentColor",
          }}
        />
      )}
      <div className="text-gray-500 dark:text-gray-400 w-12">#{item.id}</div>
      {item.coverUrl && (
        <div className="w-12 h-12 shrink-0">
          <img
            src={item.coverUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      {!item.coverUrl && (
        <div className="w-12 h-12 shrink-0 bg-gray-400 dark:bg-gray-600 border border-gray-800 dark:border-gray-400" />
      )}
      <div className="flex-1">
        <div className="flex-1 flex flex gap-2">
          <div className="text-black dark:text-white font-medium">
            {item.name}
          </div>
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            {item.description}
          </div>
        </div>
        <Waveform
          height={12}
          colorPalette={{
            background: "#1a1a1a",
            lowFrequency: "#E74C3C",
            midFrequency: "#3498DB",
            highFrequency: "#2ECC71",
            centerLine: "#ECF0F1",
          }}
          audioUrl={"http://localhost:3001/audio/track1.mp3"}
        />
      </div>
    </div>
  );
}
