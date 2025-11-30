import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { TableVirtualizer, TableVirtualizerHandle } from "./TableVirtualizer";
import { useData } from "@/hooks/useData";
import { usePanelEvent, useIsPanelFocused } from "@/hooks/usePanelEvent";

const ITEM_HEIGHT = 32;
const OVERSCAN = 3;

interface ListItem {
  id: string;
  name: string;
  emoji: string | null;
}

function ListItemRenderer({
  item,
  index: _index,
  isSelected,
  onClick,
  isPanelFocused,
}: {
  item: ListItem;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  isPanelFocused: boolean;
}) {
  return (
    <div
      className="p-2 text-xs relative"
      style={{
        backgroundColor: isSelected
          ? "rgba(128, 128, 128, 0.15)"
          : "transparent",
      }}
      onClick={onClick}
    >
      {isSelected && isPanelFocused && (
        <>
          <div className="w-3 h-3 rounded-full bg-red-500 shrink-0 absolute animate-ping left-1 blur-[2px]" />
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 absolute left-1" />
        </>
      )}
      <div
        className={`flex items-center gap-2 font-mono ${
          isSelected
            ? "text-black dark:text-white font-bold"
            : "text-gray-500 dark:text-gray-400 font-normal"
        }`}
      >
        {item.emoji && <span>{item.emoji}</span>}
        <span>{item.name}</span>
      </div>
    </div>
  );
}

export function Lists() {
  const { tags, activeTag, setActiveTag } = useData();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const tableVirtualizerRef = useRef<TableVirtualizerHandle>(null);
  const isPanelFocused = useIsPanelFocused("leftSidebar");

  // Convert tags to ListItem format
  const items = useMemo<ListItem[]>(() => {
    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      emoji: tag.emoji,
    }));
  }, [tags]);

  // Update selectedIndex when activeTag changes
  useEffect(() => {
    const index = tags.findIndex((tag) => tag.name === activeTag);
    if (index >= 0) {
      setSelectedIndex(index);
      setTimeout(() => {
        tableVirtualizerRef.current?.scrollToIndexIfNeeded(index);
      }, 0);
    }
  }, [activeTag, tags]);

  // Move up - change active tag immediately
  const moveUp = useCallback(() => {
    setSelectedIndex((prev) => {
      const newIndex = Math.max(0, prev - 1);
      const newTag = tags[newIndex];
      if (newTag) {
        setActiveTag(newTag.name);
      }
      setTimeout(() => {
        tableVirtualizerRef.current?.scrollToIndexIfNeeded(newIndex);
      }, 0);
      return newIndex;
    });
  }, [tags, setActiveTag]);

  // Move down - change active tag immediately
  const moveDown = useCallback(() => {
    setSelectedIndex((prev) => {
      const newIndex = Math.min(tags.length - 1, prev + 1);
      const newTag = tags[newIndex];
      if (newTag) {
        setActiveTag(newTag.name);
      }
      setTimeout(() => {
        tableVirtualizerRef.current?.scrollToIndexIfNeeded(newIndex);
      }, 0);
      return newIndex;
    });
  }, [tags, setActiveTag]);

  // Handle item click
  const handleItemClick = useCallback(
    (index: number) => {
      const tag = tags[index];
      if (tag) {
        setSelectedIndex(index);
        setActiveTag(tag.name);
        setTimeout(() => {
          tableVirtualizerRef.current?.scrollToIndexIfNeeded(index);
        }, 0);
      }
    },
    [tags, setActiveTag]
  );

  // Register panel events for arrow keys
  usePanelEvent("leftSidebar", {
    arrowUp: moveUp,
    arrowDown: moveDown,
  });

  const handleSelectedIndexClamp = useCallback(
    (clampedIndex: number) => {
      setSelectedIndex(clampedIndex);
      const tag = tags[clampedIndex];
      if (tag) {
        setActiveTag(tag.name);
      }
    },
    [tags, setActiveTag]
  );

  return (
    <div className="grow flex flex-col h-full">
      {/* <div className="text-black dark:text-white font-mono text-xs p-2 border-b border-black dark:border-white opacity-60">
        {tracks.length} tracks in "{activeTag}"
      </div> */}
      <TableVirtualizer
        ref={tableVirtualizerRef}
        items={items}
        itemHeight={ITEM_HEIGHT}
        overscan={OVERSCAN}
        renderItem={(item, index) => (
          <ListItemRenderer
            item={item}
            index={index}
            isSelected={index === selectedIndex}
            onClick={() => handleItemClick(index)}
            isPanelFocused={isPanelFocused}
          />
        )}
        selectedIndex={selectedIndex}
        onSelectedIndexClamp={handleSelectedIndexClamp}
        className="flex-1"
      />
    </div>
  );
}
