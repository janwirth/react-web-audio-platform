import { useReducer, useRef, useCallback } from "react";
import { useAtom } from "jotai";
import { HotkeysBar } from "../components/HotkeysBar";
import { TableVirtualizerHandle } from "../components/TableVirtualizer";
import { TabsBar } from "../components/TabsBar";
import { State, Update } from "./LayoutState";
import { useLayoutHotkeys } from "../hooks/useLayoutHotkeys";
import { PanelEventBusProvider } from "../hooks/usePanelEvent";
import { defaultTabs, CenterAreaContent } from "./Data";
import { DarkModeToggle } from "../components/DarkModeToggle";
import { AudioContextProvider } from "../components/audio-context";
import { Queue } from "@/components/player/Queue";
import { Player } from "@/components/player/Player";
import { PlayerUI } from "@/components/player/PlayerUI";
import { debugViewAtom } from "../atoms/debugView";

const initialState: State = {
  tabs: defaultTabs,
  activeTabIndex: 0,
  focusedArea: "center",
};

function LayoutAppContent() {
  const [state, dispatch] = useReducer(Update, initialState);
  const [debugView, setDebugView] = useAtom(debugViewAtom);

  const leftSidebarRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const rightSidebarRef = useRef<HTMLDivElement>(null);
  const centerVirtualizerRef = useRef<TableVirtualizerHandle>(null);

  // Get hotkey configurations from hook
  const hotkeys = useLayoutHotkeys({
    dispatch,
    state,
    leftSidebarRef,
    centerRef,
    rightSidebarRef,
  });

  // Center panel handlers for virtualizer scrolling
  const handleCenterArrowUp = useCallback(() => {
    if (centerVirtualizerRef.current) {
      centerVirtualizerRef.current.scrollByRows(-1);
    }
  }, []);

  const handleCenterArrowDown = useCallback(() => {
    if (centerVirtualizerRef.current) {
      centerVirtualizerRef.current.scrollByRows(1);
    }
  }, []);

  return (
    <div className="h-screen flex flex-col font-mono bg-white dark:bg-black text-black dark:text-white">
      <div className="flex items-center gap-2 px-4 py-2">
        <DarkModeToggle />
        <button
          onClick={() => setDebugView(!debugView)}
          className={`text-xs font-mono px-2 py-1 border transition-colors ${
            debugView
              ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
              : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 border-gray-300 dark:border-gray-700 hover:border-gray-500 dark:hover:border-gray-500"
          }`}
          aria-label="Toggle debug view"
        >
          ?
        </button>
      </div>
      <div className="px-4 py-2">
        <PlayerUI />
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div
          ref={leftSidebarRef}
          onClick={() => dispatch({ type: "PanelToLeft" })}
          className="w-64 p-4 overflow-y-auto cursor-pointer transition-opacity opacity-80 hover:opacity-100 relative"
        >
          {state.focusedArea === "left" && (
            <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
          )}
          {/* Tabs Bar */}
          <TabsBar
            tabs={state.tabs}
            activeTabIndex={state.activeTabIndex}
            dispatch={dispatch}
          />
        </div>

        {/* Center Area */}
        <div
          ref={centerRef}
          onClick={() => {
            // If we're on left, go right once to get to center
            // If we're on right, go left once to get to center
            if (state.focusedArea === "left") {
              dispatch({ type: "PanelToRight" });
            } else if (state.focusedArea === "right") {
              dispatch({ type: "PanelToLeft" });
            }
          }}
          className="flex-1 flex flex-col overflow-hidden relative p-4"
        >
          {state.focusedArea === "center" && (
            <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-red-500 rounded-full z-10" />
          )}
          <CenterAreaContent
            onArrowUp={handleCenterArrowUp}
            onArrowDown={handleCenterArrowDown}
          />
          {/* Example: Use TableVirtualizer with data from Data.tsx
          <TableVirtualizer
            ref={centerVirtualizerRef}
            items={tableItems}
            itemHeight={32}
            overscan={5}
            onFocus={() => dispatch({ type: "PanelToRight" })}
            renderItem={(item, index) => (
              <TableItemRenderer item={item} index={index} />
            )}
          /> */}
        </div>

        {/* Right Sidebar */}
        <div
          ref={rightSidebarRef}
          onClick={() => dispatch({ type: "PanelToRight" })}
          className="w-64 p-4 overflow-y-auto cursor-pointer transition-opacity opacity-80 hover:opacity-100 relative"
        >
          {state.focusedArea === "right" && (
            <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
          )}
          {/* <RightSidebarContent items={rightSidebarItems} /> */}
          <Queue />
        </div>
      </div>

      {/* Hotkeys Bar at bottom */}
      <HotkeysBar hotkeys={hotkeys} />
    </div>
  );
}

function LayoutApp() {
  return (
    <AudioContextProvider>
      <PanelEventBusProvider>
        <Player>
          <LayoutAppContent />
        </Player>
      </PanelEventBusProvider>
    </AudioContextProvider>
  );
}

export default LayoutApp;
