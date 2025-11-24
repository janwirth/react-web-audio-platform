import { useMemo, useCallback, RefObject, Dispatch } from "react";
import { HotkeyConfig } from "../components/HotkeysBar";
import { Action, State } from "../LayoutState";
import { usePanelEventBus } from "./usePanelEvent";

interface UseLayoutHotkeysParams {
  dispatch: Dispatch<Action>;
  state: State;
  leftSidebarRef: RefObject<HTMLDivElement | null>;
  centerRef: RefObject<HTMLDivElement | null>;
  rightSidebarRef: RefObject<HTMLDivElement | null>;
}

export function useLayoutHotkeys({
  dispatch,
  state,
  leftSidebarRef,
  centerRef,
  rightSidebarRef,
}: UseLayoutHotkeysParams): HotkeyConfig[] {
  const eventBus = usePanelEventBus();

  const switchTab = useCallback(
    (direction: "next" | "prev") => {
      if (direction === "next") {
        dispatch({ type: "TabNext" });
      } else {
        dispatch({ type: "TabPrevious" });
      }
    },
    [dispatch]
  );

  const switchArea = useCallback(
    (direction: "left" | "right") => {
      if (direction === "left") {
        dispatch({ type: "PanelToLeft" });
      } else {
        dispatch({ type: "PanelToRight" });
      }
    },
    [dispatch]
  );

  const handleArrowUp = useCallback(() => {
    if (!eventBus) return;
    // Emit event to the currently focused panel
    eventBus.emit(state.focusedArea, "arrowUp");
  }, [state.focusedArea, eventBus]);

  const handleArrowDown = useCallback(() => {
    if (!eventBus) return;
    // Emit event to the currently focused panel
    eventBus.emit(state.focusedArea, "arrowDown");
  }, [state.focusedArea, eventBus]);

  const hotkeys = useMemo<HotkeyConfig[]>(
    () => [
      {
        key: "tab",
        description: "Next tab",
        handler: () => switchTab("next"),
      },
      {
        key: "shift+tab",
        description: "Previous tab",
        handler: () => switchTab("prev"),
      },
      {
        key: "arrowleft",
        description: "Navigate left (sidebar/center)",
        handler: () => {
          switchArea("left");
        },
      },
      {
        key: "arrowright",
        description: "Navigate right (sidebar/center)",
        handler: () => {
          switchArea("right");
        },
      },
      {
        key: "arrowup",
        description: "Scroll up / Move selection up",
        handler: handleArrowUp,
      },
      {
        key: "arrowdown",
        description: "Scroll down / Move selection down",
        handler: handleArrowDown,
      },
    ],
    [switchTab, switchArea, handleArrowUp, handleArrowDown]
  );

  return hotkeys;
}

