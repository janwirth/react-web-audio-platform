import { useState, useMemo, useCallback, useEffect } from "react";
import { useHotkeys, createHotkeyBinding } from "@/hooks/useHotkeys";
import { usePanelEventBus } from "@/hooks/usePanelEvent";

type FocusableArea = "leftSidebar" | "center" | "rightSidebar";

export interface AreaConfig {
  render: React.ReactNode;
  focusable?: boolean;
  visible?: boolean;
}

export function normalizeArea(
  area: React.ReactNode | AreaConfig | undefined
): { render: React.ReactNode; focusable: boolean; visible: boolean } | null {
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

interface GridLayoutState {
  hasHeader: boolean;
  hasFooter: boolean;
  hasStage: boolean;
  hasLeftSidebar: boolean;
  hasCenter: boolean;
  hasRightSidebar: boolean;
}

export function computeGridTemplateAreas(state: GridLayoutState): string[] {
  const {
    hasHeader,
    hasFooter,
    hasStage,
    hasLeftSidebar,
    hasCenter,
    hasRightSidebar,
  } = state;

  // 4-character area names
  const HEAD = "head";
  const FOOT = "foot";
  const STAG = "stag";
  const LEFT = "left";
  const CENT = "cent";
  const RGHT = "rght";
  const EMPT = "."; // Empty area (CSS Grid standard)

  const rows: string[] = [];

  // Header row
  if (hasHeader) {
    rows.push(
      `"${HEAD} ${HEAD} ${HEAD} ${HEAD} ${HEAD} ${HEAD} ${HEAD} ${HEAD} ${HEAD} ${HEAD} ${HEAD} ${HEAD}"`
    );
  }

  // Stage row (if exists, spans full width)
  if (hasStage) {
    rows.push(
      `"${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG}"`
    );
    rows.push(
      `"${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG}"`
    );
    rows.push(
      `"${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG}"`
    );
    rows.push(
      `"${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG}"`
    );
    rows.push(
      `"${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG}"`
    );
    rows.push(
      `"${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG} ${STAG}"`
    );
  }

  // Main content row(s) - bottom half if stage exists, otherwise full height
  const contentRowCount = hasStage ? 6 : 12;
  for (let i = 0; i < contentRowCount; i++) {
    let row = '"';

    // Left sidebar: columns 1-2 (2 columns)
    if (hasLeftSidebar) {
      row += `${LEFT} ${LEFT} `;
    } else {
      row += `${EMPT} ${EMPT} `;
    }

    // Center: columns 3-9 (7 columns) if both sidebars, otherwise spans remaining
    if (hasCenter) {
      if (hasLeftSidebar && hasRightSidebar) {
        // Center spans columns 3-9 (7 columns)
        row += `${CENT} ${CENT} ${CENT} ${CENT} ${CENT} ${CENT} ${CENT} `;
      } else if (hasLeftSidebar) {
        // Center spans columns 3-12 (10 columns)
        row += `${CENT} ${CENT} ${CENT} ${CENT} ${CENT} ${CENT} ${CENT} ${CENT} ${CENT} ${CENT} `;
      } else if (hasRightSidebar) {
        // Center spans columns 1-9 (9 columns)
        row += `${CENT} ${CENT} ${CENT} ${CENT} ${CENT} ${CENT} ${CENT} ${CENT} ${CENT} `;
      } else {
        // Center spans full width (12 columns)
        row += `${CENT} ${CENT} ${CENT} ${CENT} ${CENT} ${CENT} ${CENT} ${CENT} ${CENT} ${CENT} ${CENT} ${CENT} `;
      }
    } else {
      // Fill empty space in center
      const centerCols =
        hasLeftSidebar && hasRightSidebar
          ? 7
          : hasLeftSidebar
          ? 10
          : hasRightSidebar
          ? 9
          : 12;
      row += `${EMPT} `.repeat(centerCols);
    }

    // Right sidebar: columns 10-12 (3 columns)
    if (hasRightSidebar) {
      row += `${RGHT} ${RGHT} ${RGHT}`;
    } else {
      row += `${EMPT} ${EMPT} ${EMPT}`;
    }

    row += '"';
    rows.push(row);
  }

  // Footer row
  if (hasFooter) {
    rows.push(
      `"${FOOT} ${FOOT} ${FOOT} ${FOOT} ${FOOT} ${FOOT} ${FOOT} ${FOOT} ${FOOT} ${FOOT} ${FOOT} ${FOOT}"`
    );
  }

  return rows;
}

interface UseGridLayoutFocusProps {
  leftSidebarConfig: ReturnType<typeof normalizeArea>;
  centerConfig: ReturnType<typeof normalizeArea>;
  rightSidebarConfig: ReturnType<typeof normalizeArea>;
}

export function useGridLayoutFocus({
  leftSidebarConfig,
  centerConfig,
  rightSidebarConfig,
}: UseGridLayoutFocusProps) {
  const [focusedArea, setFocusedArea] = useState<FocusableArea | null>(null);

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

  return {
    focusedArea,
    navigateLeft,
    navigateRight,
  };
}

interface UseGridLayoutHotkeysProps {
  navigateLeft: () => void;
  navigateRight: () => void;
  focusedArea: FocusableArea | null;
}

export function useGridLayoutHotkeys({
  navigateLeft,
  navigateRight,
  focusedArea,
}: UseGridLayoutHotkeysProps) {
  const eventBus = usePanelEventBus();

  // Create hotkey bindings for arrow keys and enter
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
      createHotkeyBinding(
        "enter",
        () => {
          if (!eventBus || !focusedArea) return;
          eventBus.emit(focusedArea, "enter");
        },
        "Activate / Select item"
      ),
    ],
    [navigateLeft, navigateRight, eventBus, focusedArea]
  );

  // Register arrow key hotkeys
  useHotkeys(arrowKeyBindings, {
    preventDefault: true,
    enableOnFormTags: true,
  });
}

interface UseGridLayoutConfigProps {
  header?: React.ReactNode | AreaConfig;
  footer?: React.ReactNode | AreaConfig;
  leftSidebar?: React.ReactNode | AreaConfig;
  rightSidebar?: React.ReactNode | AreaConfig;
  center?: React.ReactNode | AreaConfig;
  stage?: React.ReactNode | AreaConfig;
}

export function useGridLayoutConfig({
  header,
  footer,
  leftSidebar,
  rightSidebar,
  center,
  stage,
}: UseGridLayoutConfigProps) {
  // Normalize all areas
  const headerConfig = normalizeArea(header);
  const footerConfig = normalizeArea(footer);
  const leftSidebarConfig = normalizeArea(leftSidebar);
  const rightSidebarConfig = normalizeArea(rightSidebar);
  const centerConfig = normalizeArea(center);
  const stageConfig = normalizeArea(stage);

  const hasHeader = headerConfig?.visible ?? false;
  const hasFooter = footerConfig?.visible ?? false;
  const hasStage = stageConfig?.visible ?? false;
  const hasLeftSidebar = leftSidebarConfig?.visible ?? false;
  const hasCenter = centerConfig?.visible ?? false;
  const hasRightSidebar = rightSidebarConfig?.visible ?? false;

  // Compute grid template areas based on state
  const gridTemplateAreas = computeGridTemplateAreas({
    hasHeader,
    hasFooter,
    hasStage,
    hasLeftSidebar,
    hasCenter,
    hasRightSidebar,
  });

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

  return {
    headerConfig,
    footerConfig,
    leftSidebarConfig,
    rightSidebarConfig,
    centerConfig,
    stageConfig,
    hasHeader,
    hasFooter,
    hasStage,
    hasLeftSidebar,
    hasCenter,
    hasRightSidebar,
    gridTemplateAreas,
    gridTemplateRows: rows.join(" "),
  };
}


