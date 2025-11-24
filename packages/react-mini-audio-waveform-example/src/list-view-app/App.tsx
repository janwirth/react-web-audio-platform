import { useRef, useState } from "react";
import { DualViewList, DualViewListHandle } from "../components/DualViewList";

// Shared dummy data
const sharedItems = Array.from({ length: 350 }, (_, i) => ({
  id: i + 1,
  title: `Item ${i + 1}`,
  name: `Item ${i + 1}`,
  description: `This is item number ${i + 1} in the virtualized list`,
  coverUrl:
    i % 2 === 0
      ? "https://i.scdn.co/image/ab67616d00001e02d9194aa18fa4c9362b47464f"
      : null,
}));

function App() {
  const dualViewListRef = useRef<DualViewListHandle>(null);
  const [cursorIndex, setCursorIndex] = useState(0);

  return (
    <div className="h-screen flex flex-col">
      {/* Control buttons */}
      <div className="flex items-center gap-2 p-4 border-b border-black dark:border-white">
        <button
          onClick={() => dualViewListRef.current?.moveUp()}
          className="font-mono text-sm border border-black dark:border-white px-3 py-1 hover:opacity-60 transition-opacity"
        >
          ↑ Up
        </button>
        <button
          onClick={() => dualViewListRef.current?.moveDown()}
          className="font-mono text-sm border border-black dark:border-white px-3 py-1 hover:opacity-60 transition-opacity"
        >
          ↓ Down
        </button>
        <div className="font-mono text-sm ml-4">Cursor: {cursorIndex}</div>
      </div>

      {/* DualViewList */}
      <div className="flex-1 min-h-0">
        <DualViewList
          ref={dualViewListRef}
          items={sharedItems}
          onCursorChange={setCursorIndex}
          renderItem={(item, _index, isSelected) => (
            <div
              className="dark:border-gray-800 hover:opacity-60 transition-opacity font-mono text-sm relative"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                backgroundColor: isSelected
                  ? "rgba(128, 128, 128, 0.15)"
                  : "transparent",
              }}
            >
              {isSelected && (
                <div
                  className="w-1.5 h-1.5 rounded-full absolute left-2"
                  style={{
                    backgroundColor: "currentColor",
                  }}
                />
              )}
              <div className="text-gray-500 dark:text-gray-400 w-12">
                #{item.id}
              </div>
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
                <div className="text-black dark:text-white font-medium">
                  {item.name}
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-xs">
                  {item.description}
                </div>
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}

export default App;
