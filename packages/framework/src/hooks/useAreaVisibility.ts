import { useState, useCallback, useMemo } from "react";
import { useHotkeys, createHotkeyBinding, HotkeyBinding } from "./useHotkeys";

export type AreaType = "player" | "footer" | "leftSidebar" | "rightSidebar" | "center" | "visualizer" | "header" | "stage"; // header and stage are legacy

export interface AreaVisibilityState {
  player: boolean;
  footer: boolean;
  leftSidebar: boolean;
  rightSidebar: boolean;
  center: boolean;
  visualizer: boolean;
  // Legacy properties for backward compatibility
  header?: boolean;
  stage?: boolean;
}

export interface AreaHotkeyInfo {
  /** The logical key (e.g., "H", "L") */
  key: string;
  /** Description with hint format (e.g., "[H]eader", "[L]eft") */
  description: string;
}

export interface UseAreaVisibilityReturn {
  visibility: AreaVisibilityState;
  toggleArea: (area: AreaType) => void;
  setAreaVisibility: (area: AreaType, visible: boolean) => void;
  /** Hotkey bindings for use with hotkey components */
  hotkeyBindings: HotkeyBinding[];
  /** Hotkey info for display */
  hotkeyInfo: AreaHotkeyInfo[];
}

export function useAreaVisibility(
  initialVisibility: Partial<AreaVisibilityState> = {}
): UseAreaVisibilityReturn {
  // Support both new and legacy prop names
  const playerValue = initialVisibility.player ?? initialVisibility.header ?? true;
  const visualizerValue = initialVisibility.visualizer ?? initialVisibility.stage ?? true;
  
  const [visibility, setVisibility] = useState<AreaVisibilityState>({
    player: playerValue,
    footer: initialVisibility.footer ?? true,
    leftSidebar: initialVisibility.leftSidebar ?? true,
    rightSidebar: initialVisibility.rightSidebar ?? true,
    center: initialVisibility.center ?? true,
    visualizer: visualizerValue,
    // Legacy properties for backward compatibility
    header: playerValue,
    stage: visualizerValue,
  });

  const toggleArea = useCallback((area: AreaType) => {
    setVisibility((prev) => {
      // Map legacy area types to new ones
      const mappedArea = area === "header" ? "player" : area === "stage" ? "visualizer" : area;
      const newState = {
        ...prev,
        [mappedArea]: !prev[mappedArea as keyof AreaVisibilityState],
      };
      // Keep legacy properties in sync
      if (area === "header" || mappedArea === "player") {
        newState.header = newState.player;
      }
      if (area === "stage" || mappedArea === "visualizer") {
        newState.stage = newState.visualizer;
      }
      return newState;
    });
  }, []);

  const setAreaVisibility = useCallback((area: AreaType, visible: boolean) => {
    setVisibility((prev) => {
      // Map legacy area types to new ones
      const mappedArea = area === "header" ? "player" : area === "stage" ? "visualizer" : area;
      const newState = {
        ...prev,
        [mappedArea]: visible,
      };
      // Keep legacy properties in sync
      if (area === "header" || mappedArea === "player") {
        newState.header = visible;
      }
      if (area === "stage" || mappedArea === "visualizer") {
        newState.stage = visible;
      }
      return newState;
    });
  }, []);

  // Create hotkey bindings
  const hotkeyBindings = useMemo<HotkeyBinding[]>(
    () => [
      createHotkeyBinding("p", () => toggleArea("player"), "[P]layer"),
      createHotkeyBinding("f", () => toggleArea("footer"), "[F]ooter"),
      createHotkeyBinding("l", () => toggleArea("leftSidebar"), "[L]eft"),
      createHotkeyBinding("r", () => toggleArea("rightSidebar"), "[R]ight"),
      createHotkeyBinding("c", () => toggleArea("center"), "[C]enter"),
      createHotkeyBinding("v", () => toggleArea("visualizer"), "[V]isualizer"),
      // Legacy hotkeys for backward compatibility
      createHotkeyBinding("h", () => toggleArea("header"), "[H]eader (legacy)"),
      createHotkeyBinding("s", () => toggleArea("stage"), "[S]tage (legacy)"),
    ],
    [toggleArea]
  );

  // Register hotkeys using generic hook
  useHotkeys(hotkeyBindings, { preventDefault: true, enableOnFormTags: true });

  // Create hotkey info for display
  const hotkeyInfo = useMemo<AreaHotkeyInfo[]>(
    () => hotkeyBindings.map((binding) => ({
      key: binding.displayKey || binding.code.replace("Key", ""),
      description: binding.description,
    })),
    [hotkeyBindings]
  );

  return {
    visibility,
    toggleArea,
    setAreaVisibility,
    hotkeyBindings,
    hotkeyInfo,
  };
}

