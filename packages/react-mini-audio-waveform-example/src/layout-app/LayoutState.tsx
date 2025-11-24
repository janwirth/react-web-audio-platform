export type State = {
  focusedArea: "left" | "center" | "right";
  tabs: Tab[];
  activeTabIndex: number;
};

export type Tab = {
  id: string;
  title: string;
};
export type Action =
  | { type: "PanelToLeft" }
  | { type: "PanelToRight" }
  | { type: "TabNext" }
  | { type: "TabPrevious" }
  | { type: "TabAdd"; tab: Tab }
  | { type: "TabClose"; tabId: string }
  | { type: "TabSetActive"; index: number };

export const Update = (state: State, action: Action): State => {
  switch (action.type) {
    case "PanelToLeft":
      switch (state.focusedArea) {
        case "left":
          return { ...state, focusedArea: "right" };
        case "center":
          return { ...state, focusedArea: "left" };
        case "right":
          return { ...state, focusedArea: "center" };
        default:
          return assertNever(state.focusedArea);
      }
    case "PanelToRight":
      switch (state.focusedArea) {
        case "left":
          return { ...state, focusedArea: "center" };
        case "center":
          return { ...state, focusedArea: "right" };
        case "right":
          return { ...state, focusedArea: "left" };
        default:
          return assertNever(state.focusedArea);
      }
    case "TabNext":
      return {
        ...state,
        activeTabIndex: nextIndex(state.tabs, state.activeTabIndex),
      };
    case "TabPrevious":
      return {
        ...state,
        activeTabIndex: previousIndex(state.tabs, state.activeTabIndex),
      };
    case "TabAdd":
      return {
        ...state,
        tabs: [...state.tabs, action.tab],
        activeTabIndex: state.tabs.length,
      };
    case "TabClose":
      const tabIndex = state.tabs.findIndex((tab) => tab.id === action.tabId);
      if (tabIndex === -1) return state;

      const newTabs = state.tabs.filter((tab) => tab.id !== action.tabId);
      if (newTabs.length === 0) {
        // Reset to empty state - caller should handle default tabs
        return {
          ...state,
          tabs: [],
          activeTabIndex: 0,
        };
      }

      let newActiveTabIndex = state.activeTabIndex;
      if (tabIndex === state.activeTabIndex) {
        // Closed the active tab, switch to first tab
        newActiveTabIndex = 0;
      } else if (tabIndex < state.activeTabIndex) {
        // Closed a tab before the active one, adjust index
        newActiveTabIndex = state.activeTabIndex - 1;
      }

      return {
        ...state,
        tabs: newTabs,
        activeTabIndex: newActiveTabIndex,
      };
    case "TabSetActive":
      if (action.index >= 0 && action.index < state.tabs.length) {
        return {
          ...state,
          activeTabIndex: action.index,
        };
      }
      return state;
    default:
      return assertNever(action);
  }
};
const nextIndex = (array: any[], index: number) => {
  // when on last index, wrap to first index
  if (index === array.length - 1) {
    return 0;
  }
  // when on first index, wrap to last index
  if (index === 0) {
    return array.length - 1;
  }
  // otherwise, return next index
  return (index + 1) % array.length;
};

const previousIndex = (array: any[], index: number) => {
  // when on first index, wrap to last index
  if (index === 0) {
    return array.length - 1;
  }
  // otherwise, return previous index
  return (index - 1 + array.length) % array.length;
};
const assertNever = (value: never): never => {
  throw new Error(`Unexpected value: ${value}`);
};
