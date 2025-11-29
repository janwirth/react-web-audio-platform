import { useState, useCallback, useMemo } from "react";
import { useHotkeys, createHotkeyBinding, HotkeyBinding } from "./useHotkeys";

export type AreaType = "header" | "footer" | "leftSidebar" | "rightSidebar" | "center" | "stage";

export interface AreaVisibilityState {
  header: boolean;
  footer: boolean;
  leftSidebar: boolean;
  rightSidebar: boolean;
  center: boolean;
  stage: boolean;
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
  const [visibility, setVisibility] = useState<AreaVisibilityState>({
    header: initialVisibility.header ?? true,
    footer: initialVisibility.footer ?? true,
    leftSidebar: initialVisibility.leftSidebar ?? true,
    rightSidebar: initialVisibility.rightSidebar ?? true,
    center: initialVisibility.center ?? true,
    stage: initialVisibility.stage ?? true,
  });

  const toggleArea = useCallback((area: AreaType) => {
    setVisibility((prev) => ({
      ...prev,
      [area]: !prev[area],
    }));
  }, []);

  const setAreaVisibility = useCallback((area: AreaType, visible: boolean) => {
    setVisibility((prev) => ({
      ...prev,
      [area]: visible,
    }));
  }, []);

  // Create hotkey bindings
  const hotkeyBindings = useMemo<HotkeyBinding[]>(
    () => [
      createHotkeyBinding("h", () => toggleArea("header"), "[H]eader"),
      createHotkeyBinding("f", () => toggleArea("footer"), "[F]ooter"),
      createHotkeyBinding("l", () => toggleArea("leftSidebar"), "[L]eft"),
      createHotkeyBinding("r", () => toggleArea("rightSidebar"), "[R]ight"),
      createHotkeyBinding("c", () => toggleArea("center"), "[C]enter"),
      createHotkeyBinding("s", () => toggleArea("stage"), "[S]tage"),
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

