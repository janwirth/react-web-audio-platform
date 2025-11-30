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
  hasPlayer: boolean;
  hasFooter: boolean;
  hasVisualizer: boolean;
  hasLeftSidebar: boolean;
  hasCenter: boolean;
  hasRightSidebar: boolean;
}

export function computeGridTemplateAreas(state: GridLayoutState): string[] {
  const {
    hasPlayer,
    hasFooter,
    hasVisualizer,
    hasLeftSidebar,
    hasCenter,
    hasRightSidebar,
  } = state;

  // 4-character area names
  const PLAY = "play";
  const FOOT = "foot";
  const VIZZ = "vizz";
  const LEFT = "left";
  const CENT = "cent";
  const RGHT = "rght";
  const EMPT = "."; // Empty area (CSS Grid standard)

  const rows: string[] = [];

  // Visualizer row (if exists, spans full width) - comes first
  if (hasVisualizer) {
    rows.push(
      `"${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ}"`
    );
    rows.push(
      `"${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ}"`
    );
    rows.push(
      `"${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ}"`
    );
    rows.push(
      `"${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ}"`
    );
    rows.push(
      `"${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ}"`
    );
    rows.push(
      `"${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ} ${VIZZ}"`
    );
  }

  // Player row (if exists, spans full width) - comes after visualizer
  if (hasPlayer) {
    rows.push(
      `"${PLAY} ${PLAY} ${PLAY} ${PLAY} ${PLAY} ${PLAY} ${PLAY} ${PLAY} ${PLAY} ${PLAY} ${PLAY} ${PLAY}"`
    );
  }

  // Main content row(s) - bottom half if visualizer exists, otherwise full height
  const contentRowCount = hasVisualizer ? 6 : 12;
  for (let i = 0; i < contentRowCount; i++) {
    let row = '"';

    // Left sidebar: columns 1-2 (2 columns) - only if visible
    if (hasLeftSidebar) {
      row += `${LEFT} ${LEFT} `;
    }

    // Center: spans remaining columns based on sidebar visibility
    if (hasCenter) {
      if (hasLeftSidebar && hasRightSidebar) {
        // Center spans columns 3-9 (7 columns)
        row += `${CENT} ${CENT} ${CENT} ${CENT} ${CENT} ${CENT} ${CENT} `;
      } else if (hasLeftSidebar) {
        // Center spans columns 3-12 (10 columns)
        row += `${CENT} ${CENT} ${CENT} ${CENT} ${CENT} ${CENT} ${CENT} ${CENT} ${CENT} ${CENT} `;
      } else if (hasRightSidebar) {
        // Center spans columns 1-9 (9 columns) - full width minus right sidebar
        row += `${CENT} ${CENT} ${CENT} ${CENT} ${CENT} ${CENT} ${CENT} ${CENT} ${CENT} `;
      } else {
        // Center spans full width (12 columns) - no sidebars
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

    // Right sidebar: columns 10-12 (3 columns) - only if visible
    if (hasRightSidebar) {
      row += `${RGHT} ${RGHT} ${RGHT}`;
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
  player?: React.ReactNode | AreaConfig;
  footer?: React.ReactNode | AreaConfig;
  leftSidebar?: React.ReactNode | AreaConfig;
  rightSidebar?: React.ReactNode | AreaConfig;
  center?: React.ReactNode | AreaConfig;
  visualizer?: React.ReactNode | AreaConfig;
  // Legacy props for backward compatibility
  header?: React.ReactNode | AreaConfig;
  stage?: React.ReactNode | AreaConfig;
}

export function useGridLayoutConfig({
  player,
  footer,
  leftSidebar,
  rightSidebar,
  center,
  visualizer,
  // Legacy props
  header,
  stage,
}: UseGridLayoutConfigProps) {
  // Normalize all areas - support both new and legacy prop names
  const playerConfig = normalizeArea(player ?? header);
  const footerConfig = normalizeArea(footer);
  const leftSidebarConfig = normalizeArea(leftSidebar);
  const rightSidebarConfig = normalizeArea(rightSidebar);
  const centerConfig = normalizeArea(center);
  const visualizerConfig = normalizeArea(visualizer ?? stage);

  const hasPlayer = playerConfig?.visible ?? false;
  const hasFooter = footerConfig?.visible ?? false;
  const hasVisualizer = visualizerConfig?.visible ?? false;
  const hasLeftSidebar = leftSidebarConfig?.visible ?? false;
  const hasCenter = centerConfig?.visible ?? false;
  const hasRightSidebar = rightSidebarConfig?.visible ?? false;

  // Compute grid template areas based on state
  const gridTemplateAreas = computeGridTemplateAreas({
    hasPlayer,
    hasFooter,
    hasVisualizer,
    hasLeftSidebar,
    hasCenter,
    hasRightSidebar,
  });

  // Build grid template rows: auto for player/footer, 1fr for content rows
  // Split main content into two equal parts if visualizer exists
  const rows: string[] = [];

  if (hasVisualizer) {
    rows.push("repeat(6, 1fr)");
  }

  if (hasPlayer) rows.push("auto");

  if (hasVisualizer) {
    rows.push("repeat(6, 1fr)");
  } else {
    rows.push("repeat(12, 1fr)");
  }

  if (hasFooter) rows.push("auto");

  return {
    playerConfig,
    footerConfig,
    leftSidebarConfig,
    rightSidebarConfig,
    centerConfig,
    visualizerConfig,
    // Legacy exports for backward compatibility
    headerConfig: playerConfig,
    stageConfig: visualizerConfig,
    hasPlayer,
    hasFooter,
    hasVisualizer,
    hasLeftSidebar,
    hasCenter,
    hasRightSidebar,
    // Legacy exports for backward compatibility
    hasHeader: hasPlayer,
    hasStage: hasVisualizer,
    gridTemplateAreas,
    gridTemplateRows: rows.join(" "),
  };
}
