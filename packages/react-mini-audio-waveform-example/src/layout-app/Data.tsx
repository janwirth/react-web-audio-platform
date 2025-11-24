import { useState, useCallback, useRef } from "react";
import { Tab } from "../LayoutState";
import { usePanelEvent } from "../hooks/usePanelEvent";
import {
  DualViewList,
  DualViewListHandle,
  DualViewListItem,
} from "../components/DualViewList";

// Example tabs data
export const defaultTabs: Tab[] = [
  {
    id: "tab-1",
    title: "Tab 1",
  },
  {
    id: "tab-2",
    title: "Tab 2",
  },
];

// Example sidebar items
export const leftSidebarItems = ["Item 1", "Item 2", "Item 3"];
export const rightSidebarItems = ["Item A", "Item B", "Item C"];

// Example table item type
export interface TableItem {
  id: number;
  name: string;
  description: string;
}

// Example table items data
export const generateTableItems = (count: number = 1000): TableItem[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    description: `This is item number ${i + 1} with some description text`,
  }));
};

// Example dual view list items data
export const generateDualViewListItems = (
  count: number = 350
): DualViewListItem[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: `Item ${i + 1}`,
    name: `Item ${i + 1}`,
    description: `This is item number ${i + 1} in the virtualized list`,
    coverUrl:
      i % 2 === 0
        ? "https://i.scdn.co/image/ab67616d00001e02d9194aa18fa4c9362b47464f"
        : null,
  }));
};

// Example sidebar components
export function LeftSidebarContent({ items }: { items: string[] }) {
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  usePanelEvent("left", {
    arrowUp: useCallback(() => {
      const event = "Arrow Up";
      console.log(`[Left Panel] ${event}`);
      setLastEvent(event);
    }, []),
    arrowDown: useCallback(() => {
      const event = "Arrow Down";
      console.log(`[Left Panel] ${event}`);
      setLastEvent(event);
    }, []),
  });

  return (
    <div className="space-y-2 text-xs opacity-80">
      {items.map((item, index) => (
        <div key={index}>{item}</div>
      ))}
      {lastEvent && (
        <div className="mt-4 pt-2 border-t border-gray-300 dark:border-gray-700 text-xs opacity-60">
          Last event: {lastEvent}
        </div>
      )}
    </div>
  );
}

export function RightSidebarContent({ items }: { items: string[] }) {
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  usePanelEvent("right", {
    arrowUp: useCallback(() => {
      const event = "Arrow Up";
      console.log(`[Right Panel] ${event}`);
      setLastEvent(event);
    }, []),
    arrowDown: useCallback(() => {
      const event = "Arrow Down";
      console.log(`[Right Panel] ${event}`);
      setLastEvent(event);
    }, []),
  });

  return (
    <div className="space-y-2 text-xs opacity-80">
      {items.map((item, index) => (
        <div key={index}>{item}</div>
      ))}
      {lastEvent && (
        <div className="mt-4 pt-2 border-t border-gray-300 dark:border-gray-700 text-xs opacity-60">
          Last event: {lastEvent}
        </div>
      )}
    </div>
  );
}

export function CenterAreaContent({
  onArrowUp,
  onArrowDown,
}: {
  onArrowUp?: () => void;
  onArrowDown?: () => void;
}) {
  const dualViewListRef = useRef<DualViewListHandle>(null);
  const items = generateDualViewListItems(350);

  usePanelEvent("center", {
    arrowUp: useCallback(() => {
      console.log(`[Center Panel] Arrow Up`);
      dualViewListRef.current?.moveUp();
      onArrowUp?.();
    }, [onArrowUp]),
    arrowDown: useCallback(() => {
      console.log(`[Center Panel] Arrow Down`);
      dualViewListRef.current?.moveDown();
      onArrowDown?.();
    }, [onArrowDown]),
  });

  return (
    <div className="h-full min-h-0 flex flex-col ">
      <DualViewList
        ref={dualViewListRef}
        items={items}
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
  );
}

// Example table item renderer component
export function TableItemRenderer({
  item,
  index,
}: {
  item: TableItem;
  index: number;
}) {
  return (
    <div
      className={`
        px-4 py-1 text-sm font-mono
        flex items-center gap-4
        ${index % 2 === 0 ? "opacity-80" : "opacity-100"}
      `}
    >
      <span className="w-12 text-xs opacity-60">{item.id}</span>
      <span className="flex-1">{item.name}</span>
      <span className="text-xs opacity-60">{item.description}</span>
    </div>
  );
}
