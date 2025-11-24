import { useRef, useState, useEffect } from "react";
import { DualViewListHandle } from "../components/DualViewList";
import { DualViewList } from "@/components/DualViewList.1";

function App() {
  const dualViewListRef = useRef<DualViewListHandle>(null);
  const [cursorIndex, setCursorIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCursorIndex(dualViewListRef.current?.getCursorIndex() ?? 0);
    }, 100);
    return () => clearInterval(interval);
  }, []);

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
        <DualViewList ref={dualViewListRef} />
      </div>
    </div>
  );
}

export default App;
