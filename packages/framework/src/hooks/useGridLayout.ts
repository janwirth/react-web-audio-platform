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
  hasSettings: boolean;
  hasVisualizer: boolean;
  hasLeftSidebar: boolean;
  hasCenter: boolean;
  hasRightSidebar: boolean;
}

export function computeGridTemplateAreas(state: GridLayoutState): string[] {
  const {
    hasPlayer,
    hasFooter,
    hasSettings,
    hasVisualizer,
    hasLeftSidebar,
    hasCenter,
    hasRightSidebar,
  } = state;

  // 4-character area names
  const PLAY = "play";
  const FOOT = "foot";
  const SETT = "sett";
  const VIZZ = "vizz";
  const LEFT = "left";
  const CENT = "cent";
  const RGHT = "rght";
  const EMPT = "."; // Empty area (CSS Grid standard)

  const rows: string[] = [];

  // Visualizer row (if exists, spans full width) - comes first
  // When visualizer is open, it takes up most space (1fr) and player shrinks to content
  if (hasVisualizer) {
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

  // Main content row(s) - when visualizer is open, don't allocate content rows
  // (visualizer and player take up the space)
  const contentRowCount = hasVisualizer ? 0 : 12;
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

  // Settings row (if exists, spans full width, above footer)
  if (hasSettings) {
    rows.push(
      `"${SETT} ${SETT} ${SETT} ${SETT} ${SETT} ${SETT} ${SETT} ${SETT} ${SETT} ${SETT} ${SETT} ${SETT}"`
    );
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
  const eventBus = usePanelEventBus();

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
      const initialFocus = focusableAreas[0];
      setFocusedArea(initialFocus);
      eventBus?.setFocusedPanel(initialFocus);
    }
  }, [focusableAreas, focusedArea, eventBus]);

  // Notify event bus when focus changes
  useEffect(() => {
    if (focusedArea) {
      eventBus?.setFocusedPanel(focusedArea);
    }
  }, [focusedArea, eventBus]);

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
  settings?: React.ReactNode | AreaConfig;
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
  settings,
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
  const settingsConfig = normalizeArea(settings);
  const leftSidebarConfig = normalizeArea(leftSidebar);
  const rightSidebarConfig = normalizeArea(rightSidebar);
  const centerConfig = normalizeArea(center);
  const visualizerConfig = normalizeArea(visualizer ?? stage);

  const hasPlayer = playerConfig?.visible ?? false;
  const hasFooter = footerConfig?.visible ?? false;
  const hasSettings = settingsConfig?.visible ?? false;
  const hasVisualizer = visualizerConfig?.visible ?? false;
  const hasLeftSidebar = leftSidebarConfig?.visible ?? false;
  const hasCenter = centerConfig?.visible ?? false;
  const hasRightSidebar = rightSidebarConfig?.visible ?? false;

  // When visualizer is open, show only player and visualizer (hide other components)
  const finalHasSettings = hasVisualizer ? false : hasSettings;
  const finalHasLeftSidebar = hasVisualizer ? false : hasLeftSidebar;
  const finalHasCenter = hasVisualizer ? false : hasCenter;
  const finalHasRightSidebar = hasVisualizer ? false : hasRightSidebar;

  // Update config objects to reflect visibility when visualizer is open
  const finalSettingsConfig =
    hasVisualizer && settingsConfig
      ? { ...settingsConfig, visible: false }
      : settingsConfig;
  const finalLeftSidebarConfig =
    hasVisualizer && leftSidebarConfig
      ? { ...leftSidebarConfig, visible: false }
      : leftSidebarConfig;
  const finalCenterConfig =
    hasVisualizer && centerConfig
      ? { ...centerConfig, visible: false }
      : centerConfig;
  const finalRightSidebarConfig =
    hasVisualizer && rightSidebarConfig
      ? { ...rightSidebarConfig, visible: false }
      : rightSidebarConfig;

  // Compute grid template areas based on state
  const gridTemplateAreas = computeGridTemplateAreas({
    hasPlayer,
    hasFooter,
    hasSettings: finalHasSettings,
    hasVisualizer,
    hasLeftSidebar: finalHasLeftSidebar,
    hasCenter: finalHasCenter,
    hasRightSidebar: finalHasRightSidebar,
  });

  // Build grid template rows: auto for player/footer/settings, 1fr for content rows
  // When visualizer is open, only show visualizer and player (player shrinks to content)
  const rows: string[] = [];

  if (hasVisualizer) {
    // Visualizer takes up most of the space (expands to fill available space)
    rows.push("1fr");
  }

  if (hasPlayer) rows.push("auto");

  if (!hasVisualizer) {
    // When visualizer is not open, allocate space for content rows
    rows.push("repeat(12, 1fr)");
  }

  if (finalHasSettings) rows.push("auto");
  if (hasFooter) rows.push("auto");

  return {
    playerConfig,
    footerConfig,
    settingsConfig: finalSettingsConfig,
    leftSidebarConfig: finalLeftSidebarConfig,
    rightSidebarConfig: finalRightSidebarConfig,
    centerConfig: finalCenterConfig,
    visualizerConfig,
    // Legacy exports for backward compatibility
    headerConfig: playerConfig,
    stageConfig: visualizerConfig,
    hasPlayer,
    hasFooter,
    hasSettings: finalHasSettings,
    hasVisualizer,
    hasLeftSidebar: finalHasLeftSidebar,
    hasCenter: finalHasCenter,
    hasRightSidebar: finalHasRightSidebar,
    // Legacy exports for backward compatibility
    hasHeader: hasPlayer,
    hasStage: hasVisualizer,
    gridTemplateAreas,
    gridTemplateRows: rows.join(" "),
  };
}
