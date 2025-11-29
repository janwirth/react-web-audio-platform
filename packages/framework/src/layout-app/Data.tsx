import { useState, useCallback, useRef } from "react";
import { usePanelEvent } from "../hooks/usePanelEvent";
import { TracklistHandle } from "../components/Tracklist";
import { Tracklist } from "@/components/Tracklist";

// Example tabs data
// export const defaultTabs: Tab[] = [
//   {
//     id: "tab-1",
//     title: "Tab 1",
//   },
//   {
//     id: "tab-2",
//     title: "Tab 2",
//   },
// ];

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

export function CenterAreaContent({
  onArrowUp,
  onArrowDown,
}: {
  onArrowUp?: () => void;
  onArrowDown?: () => void;
}) {
  const tracklistRef = useRef<TracklistHandle>(null);

  usePanelEvent("center", {
    arrowUp: useCallback(() => {
      console.log(`[Center Panel] Arrow Up`);
      tracklistRef.current?.moveUp();
      onArrowUp?.();
    }, [onArrowUp]),
    arrowDown: useCallback(() => {
      console.log(`[Center Panel] Arrow Down`);
      tracklistRef.current?.moveDown();
      onArrowDown?.();
    }, [onArrowDown]),
  });

  return <Tracklist ref={tracklistRef} />;
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
      {/* <Waveform audioUrl={item.audioUrl} /> */}
    </div>
  );
}
