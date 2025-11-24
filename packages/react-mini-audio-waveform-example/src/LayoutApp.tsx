import { useReducer, useRef, useCallback } from "react";
import { HotkeysBar } from "./components/HotkeysBar";
import { TableVirtualizerHandle } from "./components/TableVirtualizer";
import { TabsBar } from "./components/TabsBar";
import { State, Update } from "./LayoutState";
import { useLayoutHotkeys } from "./hooks/useLayoutHotkeys";
import { PanelEventBusProvider } from "./hooks/usePanelEvent";
import {
  defaultTabs,
  leftSidebarItems,
  rightSidebarItems,
  LeftSidebarContent,
  RightSidebarContent,
  CenterAreaContent,
} from "./Data";

const initialState: State = {
  tabs: defaultTabs,
  activeTabIndex: 0,
  focusedArea: "center",
};

function LayoutAppContent() {
  const [state, dispatch] = useReducer(Update, initialState);

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
      {/* Tabs Bar */}
      <TabsBar
        tabs={state.tabs}
        activeTabIndex={state.activeTabIndex}
        dispatch={dispatch}
      />

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
          <div className="text-sm font-semibold mb-4">Left Sidebar</div>
          <LeftSidebarContent items={leftSidebarItems} />
        </div>

        {/* Center Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {state.focusedArea === "center" && (
            <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-red-500 rounded-full z-10" />
          )}
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
            className="flex-1 p-4"
          >
            <div className="text-sm font-semibold mb-4">Center Area</div>
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
          <div className="text-sm font-semibold mb-4">Right Sidebar</div>
          <RightSidebarContent items={rightSidebarItems} />
        </div>
      </div>

      {/* Hotkeys Bar at bottom */}
      <HotkeysBar hotkeys={hotkeys} />
    </div>
  );
}

function LayoutApp() {
  return (
    <PanelEventBusProvider>
      <LayoutAppContent />
    </PanelEventBusProvider>
  );
}

export default LayoutApp;
