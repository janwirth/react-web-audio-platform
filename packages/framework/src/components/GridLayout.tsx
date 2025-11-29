import { ReactNode, useState, useMemo, useCallback, useEffect } from "react";
import { useHotkeys, createHotkeyBinding } from "@/hooks/useHotkeys";
import { usePanelEventBus } from "@/hooks/usePanelEvent";

type FocusableArea = "leftSidebar" | "center" | "rightSidebar";

export interface AreaConfig {
  render: ReactNode;
  focusable?: boolean;
  visible?: boolean;
}

function getHighlightablePanelClasses(
  isFocused: boolean,
  includeBorderRight: boolean = true
): string {
  const baseClasses =
    "p-4 text-black dark:text-white border-black dark:border-white";
  const borderClass = includeBorderRight ? "border-r" : "";
  const focusClasses = isFocused
    ? "outline outline-2 outline-black dark:outline-white -outline-offset-3"
    : "";

  return [baseClasses, borderClass, focusClasses].filter(Boolean).join(" ");
}

function normalizeArea(
  area: ReactNode | AreaConfig | undefined
): { render: ReactNode; focusable: boolean; visible: boolean } | null {
  if (!area) return null;

  if (typeof area === "object" && "render" in area) {
    return {
      render: area.render,
      focusable: area.focusable ?? false,
      visible: area.visible ?? true,
    };
  }

  // Legacy API: ReactNode
  return {
    render: area,
    focusable: false,
    visible: true,
  };
}

export interface GridLayoutProps {
  header?: ReactNode | AreaConfig;
  footer?: ReactNode | AreaConfig;
  leftSidebar?: ReactNode | AreaConfig;
  rightSidebar?: ReactNode | AreaConfig;
  center?: ReactNode | AreaConfig;
  stage?: ReactNode | AreaConfig;
}

export function GridLayout({
  header,
  footer,
  leftSidebar,
  rightSidebar,
  center,
  stage,
}: GridLayoutProps) {
  const [focusedArea, setFocusedArea] = useState<FocusableArea | null>(null);
  const eventBus = usePanelEventBus();

  // Normalize all areas
  const headerConfig = normalizeArea(header);
  const footerConfig = normalizeArea(footer);
  const leftSidebarConfig = normalizeArea(leftSidebar);
  const rightSidebarConfig = normalizeArea(rightSidebar);
  const centerConfig = normalizeArea(center);
  const stageConfig = normalizeArea(stage);

  // Build list of focusable areas in order
  const focusableAreas = useMemo(() => {
    const areas: FocusableArea[] = [];
    if (leftSidebarConfig?.focusable && leftSidebarConfig?.visible)
      areas.push("leftSidebar");
    if (centerConfig?.focusable && centerConfig?.visible) areas.push("center");
    if (rightSidebarConfig?.focusable && rightSidebarConfig?.visible)
      areas.push("rightSidebar");
    return areas;
  }, [leftSidebarConfig, centerConfig, rightSidebarConfig]);

  // Set initial focus to first focusable area
  useEffect(() => {
    if (focusableAreas.length > 0 && focusedArea === null) {
      setFocusedArea(focusableAreas[0]);
    }
  }, [focusableAreas, focusedArea]);

  // Navigate left
  const navigateLeft = useCallback(() => {
    if (focusableAreas.length === 0) return;
    const currentIndex = focusedArea ? focusableAreas.indexOf(focusedArea) : -1;
    if (currentIndex > 0) {
      setFocusedArea(focusableAreas[currentIndex - 1]);
    }
  }, [focusableAreas, focusedArea]);

  // Navigate right
  const navigateRight = useCallback(() => {
    if (focusableAreas.length === 0) return;
    const currentIndex = focusedArea ? focusableAreas.indexOf(focusedArea) : -1;
    if (currentIndex < focusableAreas.length - 1) {
      setFocusedArea(focusableAreas[currentIndex + 1]);
    }
  }, [focusableAreas, focusedArea]);

  // Create hotkey bindings for arrow keys
  const arrowKeyBindings = useMemo(
    () => [
      createHotkeyBinding("arrowleft", navigateLeft, "Navigate left"),
      createHotkeyBinding("arrowright", navigateRight, "Navigate right"),
      createHotkeyBinding(
        "arrowup",
        () => {
          if (!eventBus || !focusedArea) return;
          eventBus.emit(focusedArea, "arrowUp");
        },
        "Scroll up / Move selection up"
      ),
      createHotkeyBinding(
        "arrowdown",
        () => {
          if (!eventBus || !focusedArea) return;
          eventBus.emit(focusedArea, "arrowDown");
        },
        "Scroll down / Move selection down"
      ),
    ],
    [navigateLeft, navigateRight, eventBus, focusedArea]
  );

  // Register arrow key hotkeys
  useHotkeys(arrowKeyBindings, {
    preventDefault: true,
    enableOnFormTags: true,
  });
  const hasHeader = headerConfig?.visible ?? false;
  const hasFooter = footerConfig?.visible ?? false;
  const hasStage = stageConfig?.visible ?? false;

  // Build grid template rows: auto for header/footer, 1fr for content rows
  // Split main content into two equal parts if stage exists
  const rows: string[] = [];
  if (hasHeader) rows.push("auto");

  if (hasStage) {
    rows.push("repeat(6, 1fr)", "repeat(6, 1fr)");
  } else {
    rows.push("repeat(12, 1fr)");
  }

  if (hasFooter) rows.push("auto");

  return (
    <div
      className="w-full h-full font-mono"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(12, 1fr)",
        gridTemplateRows: rows.join(" "),
        height: "100vh",
      }}
    >
      {/* Header - full width, auto height */}
      {hasHeader && headerConfig && (
        <div
          className="border-b border-black dark:border-white p-4 flex items-center text-black dark:text-white"
          style={{
            gridColumn: "1 / -1",
            gridRow: "1",
          }}
        >
          {headerConfig.render}
        </div>
      )}

      {/* Stage - top half of main content, full width, above center/sidebars */}
      {hasStage && stageConfig && (
        <div
          className="border-b border-black dark:border-white p-4 text-black dark:text-white"
          style={{
            gridColumn: "1 / -1",
            gridRow: hasHeader
              ? hasFooter
                ? "2 / 8"
                : "2 / 8"
              : hasFooter
              ? "1 / 7"
              : "1 / 7",
          }}
        >
          {stageConfig.render}
        </div>
      )}

      {/* Left Sidebar - spans bottom half of main content if stage exists, otherwise full height */}
      {leftSidebarConfig?.visible && (
        <div
          className={getHighlightablePanelClasses(
            focusedArea === "leftSidebar",
            true
          )}
          style={{
            gridColumn: "1 / 3",
            gridRow: hasHeader
              ? hasStage
                ? hasFooter
                  ? "8 / -2"
                  : "8 / -1"
                : hasFooter
                ? "2 / -2"
                : "2 / -1"
              : hasStage
              ? hasFooter
                ? "7 / -2"
                : "7 / -1"
              : hasFooter
              ? "1 / -2"
              : "1 / -1",
          }}
        >
          {leftSidebarConfig.render}
        </div>
      )}

      {/* Center - bottom half of main content if stage exists, otherwise full height */}
      {centerConfig?.visible && (
        <div
          className={getHighlightablePanelClasses(
            focusedArea === "center",
            true
          )}
          style={{
            gridColumn: leftSidebarConfig?.visible
              ? rightSidebarConfig?.visible
                ? "3 / 10"
                : "3 / -1"
              : rightSidebarConfig?.visible
              ? "1 / 10"
              : "1 / -1",
            gridRow: hasHeader
              ? hasStage
                ? hasFooter
                  ? "8 / -2"
                  : "8 / -1"
                : hasFooter
                ? "2 / -2"
                : "2 / -1"
              : hasStage
              ? hasFooter
                ? "7 / -2"
                : "7 / -1"
              : hasFooter
              ? "1 / -2"
              : "1 / -1",
          }}
        >
          {centerConfig.render}
        </div>
      )}

      {/* Right Sidebar - spans bottom half of main content if stage exists, otherwise full height */}
      {rightSidebarConfig?.visible && (
        <div
          className={getHighlightablePanelClasses(
            focusedArea === "rightSidebar",
            false
          )}
          style={{
            gridColumn: "10 / -1",
            gridRow: hasHeader
              ? hasStage
                ? hasFooter
                  ? "8 / -2"
                  : "8 / -1"
                : hasFooter
                ? "2 / -2"
                : "2 / -1"
              : hasStage
              ? hasFooter
                ? "7 / -2"
                : "7 / -1"
              : hasFooter
              ? "1 / -2"
              : "1 / -1",
          }}
        >
          {rightSidebarConfig.render}
        </div>
      )}

      {/* Footer - full width, auto height */}
      {hasFooter && footerConfig && (
        <div
          className="border-t border-black dark:border-white p-4 flex items-center text-black dark:text-white"
          style={{
            gridColumn: "1 / -1",
            gridRow: "-1",
          }}
        >
          {footerConfig.render}
        </div>
      )}
    </div>
  );
}
