import type { Meta, StoryObj } from "@storybook/react";
import { useMemo, useState, useCallback, useRef } from "react";
import { GridLayout } from "@/layout-and-control/GridLayout";
import { PanelEventBusProvider } from "@/layout-and-control/hooks/usePanelEvent";
import {
  useIsPanelFocused,
  usePanelEvent,
} from "@/layout-and-control/hooks/usePanelEvent";
import { useAreaVisibility } from "@/layout-and-control/hooks/useAreaVisibility";
import { AreaVisibilityHotkeysFooter } from "@/layout-and-control/AreaVisibilityHotkeysFooter";
import { FocusIndicator } from "@/layout-and-control/FocusIndicator";
import {
  TableVirtualizer,
  type TableVirtualizerHandle,
} from "@/ui/TableVirtualizer";
import { Column } from "@/ui/Column";

const meta = {
  title: "Stories/LayoutAndControl/FocusLayout",
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Generate 1000 random items for each list
function generateRandomItems(count: number, prefix: string) {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${i}`,
    title: `${prefix} Item ${i + 1}`,
    description: `Random description ${Math.floor(Math.random() * 10000)}`,
    category: `Category ${Math.floor(Math.random() * 20) + 1}`,
    value: Math.floor(Math.random() * 1000),
  }));
}

// Component that wraps a virtual list with keyboard navigation
function VirtualListWithNavigation<T>({
  panelId,
  items,
  itemHeight,
  renderItem,
}: {
  panelId: "leftSidebar" | "center" | "rightSidebar";
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number, isCursored: boolean) => React.ReactNode;
}) {
  const [cursorIndex, setCursorIndex] = useState(0);
  const virtualizerRef = useRef<TableVirtualizerHandle>(null);

  // Handle cursor clamping when scrolling
  const handleCursorClamp = useCallback((clampedIndex: number) => {
    setCursorIndex(clampedIndex);
  }, []);

  // Move cursor up
  const moveUp = useCallback(() => {
    setCursorIndex((prev) => {
      const newIndex = Math.max(0, prev - 1);
      setTimeout(() => {
        virtualizerRef.current?.scrollToIndexIfNeeded(newIndex);
      }, 0);
      return newIndex;
    });
  }, []);

  // Move cursor down
  const moveDown = useCallback(() => {
    setCursorIndex((prev) => {
      const newIndex = Math.min(items.length - 1, prev + 1);
      setTimeout(() => {
        virtualizerRef.current?.scrollToIndexIfNeeded(newIndex);
      }, 0);
      return newIndex;
    });
  }, [items.length]);

  // Subscribe to panel events for keyboard navigation
  usePanelEvent(panelId, {
    arrowUp: moveUp,
    arrowDown: moveDown,
    enter: () => {
      // Handle enter if needed
      console.log(`Enter pressed on ${panelId}, item ${cursorIndex}`);
    },
  });

  return (
    <Column className="h-full w-full" style={{ height: "100%" }}>
      <TableVirtualizer
        ref={virtualizerRef}
        items={items}
        itemHeight={itemHeight}
        overscan={5}
        selectedIndex={cursorIndex}
        onSelectedIndexClamp={handleCursorClamp}
        renderItem={(item, index) =>
          renderItem(item, index, index === cursorIndex)
        }
        className="flex-1"
      />
    </Column>
  );
}

// Component that wraps content and shows cursor indicator
function CursorableAreaContent({
  panelId,
  children,
}: {
  panelId: "leftSidebar" | "center" | "rightSidebar";
  children: React.ReactNode;
}) {
  const isCursored = useIsPanelFocused(panelId);

  return (
    <div className="relative w-full h-full">
      {isCursored && (
        <div className="absolute top-2 left-2 z-10">
          <FocusIndicator variant="dot" />
        </div>
      )}
      {children}
    </div>
  );
}

function FocusLayoutDemo() {
  const visibilityHook = useAreaVisibility({
    player: true,
    footer: true,
    settings: false,
    leftSidebar: true,
    rightSidebar: true,
    center: true,
    visualizer: false,
  });
  const { visibility } = visibilityHook;

  // Generate random items for each list
  const leftItems = useMemo(() => generateRandomItems(1000, "left"), []);
  const centerItems = useMemo(() => generateRandomItems(1000, "center"), []);
  const rightItems = useMemo(() => generateRandomItems(1000, "right"), []);

  return (
    <PanelEventBusProvider>
      <GridLayout
        player={{
          render: (
            <div className="px-4 py-2 text-xs opacity-60">
              Player Placeholder
            </div>
          ),
          visible: visibility.player,
        }}
        footer={{
          render: (
            <div className="flex items-center justify-between w-full px-4">
              <AreaVisibilityHotkeysFooter visibilityHook={visibilityHook} />
            </div>
          ),
          visible: visibility.footer,
        }}
        leftSidebar={{
          render: (
            <CursorableAreaContent panelId="leftSidebar">
              <VirtualListWithNavigation
                panelId="leftSidebar"
                items={leftItems}
                itemHeight={60}
                renderItem={(item, index, isCursored) => (
                  <div
                    className={isCursored ? "border-l-current border-l-3" : ""}
                    style={{
                      padding: "12px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      height: "100%",
                      justifyContent: "center",
                      boxSizing: "border-box",
                      fontFamily: "monospace",
                      fontSize: "12px",
                      borderBottom: "1px solid rgba(128, 128, 128, 0.1)",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "13px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#666",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.description}
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#999",
                      }}
                    >
                      {item.category} • Value: {item.value}
                    </div>
                  </div>
                )}
              />
            </CursorableAreaContent>
          ),
          focusable: visibility.leftSidebar,
          visible: visibility.leftSidebar,
        }}
        center={{
          render: (
            <CursorableAreaContent panelId="center">
              <VirtualListWithNavigation
                panelId="center"
                items={centerItems}
                itemHeight={60}
                renderItem={(item, index, isCursored) => (
                  <div
                    className={isCursored ? "border-l-current border-l-3" : ""}
                    style={{
                      padding: "12px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      height: "100%",
                      justifyContent: "center",
                      boxSizing: "border-box",
                      fontFamily: "monospace",
                      fontSize: "12px",
                      borderBottom: "1px solid rgba(128, 128, 128, 0.1)",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "13px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#666",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.description}
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#999",
                      }}
                    >
                      {item.category} • Value: {item.value}
                    </div>
                  </div>
                )}
              />
            </CursorableAreaContent>
          ),
          focusable: visibility.center,
          visible: visibility.center,
        }}
        rightSidebar={{
          render: (
            <CursorableAreaContent panelId="rightSidebar">
              <VirtualListWithNavigation
                panelId="rightSidebar"
                items={rightItems}
                itemHeight={60}
                renderItem={(item, index, isCursored) => (
                  <div
                    className={isCursored ? "border-l-current border-l-3" : ""}
                    style={{
                      padding: "12px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      height: "100%",
                      justifyContent: "center",
                      boxSizing: "border-box",
                      fontFamily: "monospace",
                      fontSize: "12px",
                      borderBottom: "1px solid rgba(128, 128, 128, 0.1)",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "13px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#666",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.description}
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#999",
                      }}
                    >
                      {item.category} • Value: {item.value}
                    </div>
                  </div>
                )}
              />
            </CursorableAreaContent>
          ),
          focusable: visibility.rightSidebar,
          visible: visibility.rightSidebar,
        }}
      />
    </PanelEventBusProvider>
  );
}

export const Default: Story = {
  render: () => <FocusLayoutDemo />,
  parameters: {
    layout: "fullscreen",
  },
};
