import { ReactNode, useState, useMemo, useCallback, useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { usePanelEventBus } from "@/hooks/usePanelEvent";

type FocusableArea = "leftSidebar" | "center" | "rightSidebar";

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

export interface GridLayoutProps {
  header?: ReactNode;
  footer?: ReactNode;
  leftSidebar?: ReactNode;
  rightSidebar?: ReactNode;
  center?: ReactNode;
  stage?: ReactNode;
  focusableLeftSidebar?: boolean;
  focusableCenter?: boolean;
  focusableRightSidebar?: boolean;
}

export function GridLayout({
  header,
  footer,
  leftSidebar,
  rightSidebar,
  center,
  stage,
  focusableLeftSidebar = false,
  focusableCenter = false,
  focusableRightSidebar = false,
}: GridLayoutProps) {
  const [focusedArea, setFocusedArea] = useState<FocusableArea | null>(null);
  const eventBus = usePanelEventBus();

  // Build list of focusable areas in order
  const focusableAreas = useMemo(() => {
    const areas: FocusableArea[] = [];
    if (focusableLeftSidebar && leftSidebar) areas.push("leftSidebar");
    if (focusableCenter) areas.push("center");
    if (focusableRightSidebar && rightSidebar) areas.push("rightSidebar");
    return areas;
  }, [
    focusableLeftSidebar,
    focusableCenter,
    focusableRightSidebar,
    leftSidebar,
    rightSidebar,
  ]);

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

  // Handle arrow keys for navigation
  useHotkeys(
    "arrowleft",
    (e) => {
      e.preventDefault();
      navigateLeft();
    },
    { preventDefault: true, enableOnFormTags: true }
  );

  useHotkeys(
    "arrowright",
    (e) => {
      e.preventDefault();
      navigateRight();
    },
    { preventDefault: true, enableOnFormTags: true }
  );

  // Handle arrow up/down - emit to focused panel
  useHotkeys(
    "arrowup",
    (e) => {
      if (!eventBus || !focusedArea) return;
      e.preventDefault();
      eventBus.emit(focusedArea, "arrowUp");
    },
    { preventDefault: true, enableOnFormTags: true }
  );

  useHotkeys(
    "arrowdown",
    (e) => {
      if (!eventBus || !focusedArea) return;
      e.preventDefault();
      eventBus.emit(focusedArea, "arrowDown");
    },
    { preventDefault: true, enableOnFormTags: true }
  );
  const hasHeader = !!header;
  const hasFooter = !!footer;
  const hasStage = !!stage;

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
      {header && (
        <div
          className="border-b border-black dark:border-white opacity-20 p-4 flex items-center text-black dark:text-white"
          style={{
            gridColumn: "1 / -1",
            gridRow: "1",
          }}
        >
          {header}
        </div>
      )}

      {/* Stage - top half of main content, full width, above center/sidebars */}
      {stage && (
        <div
          className="border-b border-black dark:border-white opacity-20 p-4 text-black dark:text-white"
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
          {stage}
        </div>
      )}

      {/* Left Sidebar - spans bottom half of main content if stage exists, otherwise full height */}
      {leftSidebar && (
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
          {leftSidebar}
        </div>
      )}

      {/* Center - bottom half of main content if stage exists, otherwise full height */}
      <div
        className={getHighlightablePanelClasses(focusedArea === "center", true)}
        style={{
          gridColumn: leftSidebar
            ? rightSidebar
              ? "3 / 10"
              : "3 / -1"
            : rightSidebar
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
        {center || <div className="opacity-50">center section empty</div>}
      </div>

      {/* Right Sidebar - spans bottom half of main content if stage exists, otherwise full height */}
      {rightSidebar && (
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
          {rightSidebar}
        </div>
      )}

      {/* Footer - full width, auto height */}
      {footer && (
        <div
          className="border-t border-black dark:border-white opacity-20 p-4 flex items-center text-black dark:text-white"
          style={{
            gridColumn: "1 / -1",
            gridRow: "-1",
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
