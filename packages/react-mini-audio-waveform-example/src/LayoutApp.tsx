import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { HotkeysBar, HotkeyConfig } from "./components/HotkeysBar";
import { TableVirtualizer } from "./components/TableVirtualizer";

interface Tab {
  id: string;
  title: string;
}

const defaultTabs: Tab[] = [
  {
    id: "tab-1",
    title: "Tab 1",
  },
  {
    id: "tab-2",
    title: "Tab 2",
  },
];

type FocusedArea = "left" | "center" | "right";

interface TableItem {
  id: number;
  name: string;
  description: string;
}

function LayoutApp() {
  const [tabs, setTabs] = useState<Tab[]>(defaultTabs);
  const [activeTabId, setActiveTabId] = useState<string>(tabs[0]?.id || "");
  const [focusedArea, setFocusedArea] = useState<FocusedArea>("center");
  const leftSidebarRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const rightSidebarRef = useRef<HTMLDivElement>(null);
  const centerContainerRef = useRef<HTMLDivElement>(null);
  const [centerHeight, setCenterHeight] = useState(600);

  // Sample data for TableVirtualizer
  const tableItems = useMemo<TableItem[]>(() => {
    return Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      description: `This is item number ${i + 1} with some description text`,
    }));
  }, []);

  // Calculate center container height
  useEffect(() => {
    const updateHeight = () => {
      if (centerContainerRef.current) {
        const rect = centerContainerRef.current.getBoundingClientRect();
        setCenterHeight(rect.height);
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // Focus the active area element
  useEffect(() => {
    const focusArea = () => {
      let elementToFocus: HTMLDivElement | null = null;
      switch (focusedArea) {
        case "left":
          elementToFocus = leftSidebarRef.current;
          break;
        case "center":
          elementToFocus = centerRef.current;
          break;
        case "right":
          elementToFocus = rightSidebarRef.current;
          break;
      }
      if (elementToFocus) {
        elementToFocus.focus();
      }
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(focusArea, 0);
    return () => clearTimeout(timeoutId);
  }, [focusedArea]);

  const switchTab = useCallback(
    (direction: "next" | "prev") => {
      const currentIndex = tabs.findIndex((tab) => tab.id === activeTabId);
      if (currentIndex === -1) return;

      let newIndex: number;
      if (direction === "next") {
        newIndex = (currentIndex + 1) % tabs.length;
      } else {
        newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      }

      const newTab = tabs[newIndex];
      setActiveTabId(newTab.id);
    },
    [tabs, activeTabId]
  );

  const switchArea = useCallback(
    (direction: "left" | "right") => {
      const areas: FocusedArea[] = ["left", "center", "right"];
      const currentIndex = areas.indexOf(focusedArea);

      let newIndex: number;
      if (direction === "right") {
        newIndex = (currentIndex + 1) % areas.length;
      } else {
        newIndex = (currentIndex - 1 + areas.length) % areas.length;
      }

      setFocusedArea(areas[newIndex]);
    },
    [focusedArea]
  );

  // Create hotkey configurations
  const hotkeys = useMemo<HotkeyConfig[]>(
    () => [
      {
        key: "tab",
        description: "Next tab",
        handler: () => switchTab("next"),
      },
      {
        key: "shift+tab",
        description: "Previous tab",
        handler: () => switchTab("prev"),
      },
      {
        key: "arrowleft",
        description: "Navigate left (sidebar/center)",
        handler: () => {
          // Check if focus is in one of our main areas
          const focusedElement = document.activeElement;
          const isInLayoutArea =
            focusedElement === leftSidebarRef.current ||
            focusedElement === centerRef.current ||
            focusedElement === rightSidebarRef.current;

          if (isInLayoutArea) {
            switchArea("left");
          }
        },
      },
      {
        key: "arrowright",
        description: "Navigate right (sidebar/center)",
        handler: () => {
          // Check if focus is in one of our main areas
          const focusedElement = document.activeElement;
          const isInLayoutArea =
            focusedElement === leftSidebarRef.current ||
            focusedElement === centerRef.current ||
            focusedElement === rightSidebarRef.current;

          if (isInLayoutArea) {
            switchArea("right");
          }
        },
      },
    ],
    [switchTab, switchArea, leftSidebarRef, centerRef, rightSidebarRef]
  );

  const addTab = () => {
    const newTab: Tab = {
      id: `tab-${Date.now()}`,
      title: `Tab ${tabs.length + 1}`,
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = tabs.filter((tab) => tab.id !== tabId);
    if (newTabs.length === 0) {
      setTabs(defaultTabs);
      setActiveTabId(defaultTabs[0].id);
    } else {
      setTabs(newTabs);
      if (activeTabId === tabId) {
        const newActiveTab = newTabs[0];
        setActiveTabId(newActiveTab.id);
      }
    }
  };

  return (
    <div className="h-screen flex flex-col font-mono bg-white dark:bg-black text-black dark:text-white">
      {/* Tabs Bar */}
      <div className="flex items-center">
        <div className="flex-1 flex overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => {
                setActiveTabId(tab.id);
              }}
              className="flex items-center gap-2 px-4 py-2 cursor-pointer transition-opacity opacity-60 hover:opacity-100"
            >
              <span className="text-sm whitespace-nowrap">{tab.title}</span>
              <button
                onClick={(e) => closeTab(tab.id, e)}
                className="opacity-60 hover:opacity-100 text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addTab}
          className="px-3 py-2 opacity-60 hover:opacity-100 transition-opacity"
        >
          +
        </button>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div
          ref={leftSidebarRef}
          tabIndex={0}
          onClick={() => setFocusedArea("left")}
          className="w-64 p-4 overflow-y-auto outline-none cursor-pointer transition-opacity opacity-80 hover:opacity-100 relative"
        >
          {focusedArea === "left" && (
            <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
          )}
          <div className="text-sm font-semibold mb-4">Left Sidebar</div>
          <div className="space-y-2 text-xs opacity-80">
            <div>Item 1</div>
            <div>Item 2</div>
            <div>Item 3</div>
          </div>
        </div>

        {/* Center Area */}
        <div
          ref={centerContainerRef}
          className="flex-1 flex flex-col overflow-hidden relative"
        >
          {focusedArea === "center" && (
            <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-red-500 rounded-full z-10" />
          )}
          <div
            ref={centerRef}
            tabIndex={0}
            onClick={() => setFocusedArea("center")}
            className="flex-1 outline-none"
          >
            <TableVirtualizer<TableItem>
              items={tableItems}
              itemHeight={32}
              containerHeight={centerHeight}
              overscan={5}
              renderItem={(item, index, isSelected) => (
                <div
                  className={`
                    px-4 py-1 text-sm font-mono
                    flex items-center gap-4
                    ${isSelected ? "bg-gray-200 dark:bg-gray-800" : ""}
                    ${index % 2 === 0 ? "opacity-80" : "opacity-100"}
                  `}
                >
                  <span className="w-12 text-xs opacity-60">{item.id}</span>
                  <span className="flex-1">{item.name}</span>
                  <span className="text-xs opacity-60">{item.description}</span>
                </div>
              )}
            />
          </div>
        </div>

        {/* Right Sidebar */}
        <div
          ref={rightSidebarRef}
          tabIndex={0}
          onClick={() => setFocusedArea("right")}
          className="w-64 p-4 overflow-y-auto outline-none cursor-pointer transition-opacity opacity-80 hover:opacity-100 relative"
        >
          {focusedArea === "right" && (
            <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
          )}
          <div className="text-sm font-semibold mb-4">Right Sidebar</div>
          <div className="space-y-2 text-xs opacity-80">
            <div>Item A</div>
            <div>Item B</div>
            <div>Item C</div>
          </div>
        </div>
      </div>

      {/* Hotkeys Bar at bottom */}
      <HotkeysBar hotkeys={hotkeys} />
    </div>
  );
}

export default LayoutApp;
