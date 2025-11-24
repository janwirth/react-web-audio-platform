import { Dispatch } from "react";
import { Tab, Action } from "../layout-app/LayoutState";
import { defaultTabs } from "../layout-app/Data";

interface TabsBarProps {
  tabs: Tab[];
  activeTabIndex: number;
  dispatch: Dispatch<Action>;
}

export function TabsBar({ tabs, activeTabIndex, dispatch }: TabsBarProps) {
  const addTab = () => {
    const newTab: Tab = {
      id: `tab-${Date.now()}`,
      title: `Tab ${tabs.length + 1}`,
    };
    dispatch({ type: "TabAdd", tab: newTab });
  };

  const closeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const willBeEmpty = tabs.length === 1;
    dispatch({ type: "TabClose", tabId });
    // If all tabs are closed, reset to default tabs
    if (willBeEmpty) {
      // Reset to default tabs after the close action
      setTimeout(() => {
        defaultTabs.forEach((tab) => {
          dispatch({ type: "TabAdd", tab });
        });
        dispatch({ type: "TabSetActive", index: 0 });
      }, 0);
    }
  };

  return (
    <div className="flex items-center">
      <div className="flex-1 flex overflow-x-auto">
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            onClick={() => {
              dispatch({ type: "TabSetActive", index });
            }}
            className={`flex items-center gap-2 px-4 py-2 cursor-pointer transition-opacity ${
              index === activeTabIndex
                ? "opacity-100"
                : "opacity-60 hover:opacity-100"
            }`}
          >
            <span className="text-sm whitespace-nowrap">{tab.title}</span>
            <button
              onClick={(e) => closeTab(tab.id, e)}
              className="opacity-60 hover:opacity-100 text-xs"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={addTab}
        className="px-3 py-2 opacity-60 hover:opacity-100 transition-opacity"
      >
        +
      </button>
    </div>
  );
}
