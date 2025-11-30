import { UseAreaVisibilityReturn, AreaType } from "@/hooks/useAreaVisibility";

interface AreaVisibilityControlsProps {
  visibilityHook: UseAreaVisibilityReturn;
}

interface AreaConfig {
  key: AreaType;
  label: string;
  hotkeyInfo: { key: string; description: string };
}

export function AreaVisibilityControls({
  visibilityHook,
}: AreaVisibilityControlsProps) {
  const { visibility, toggleArea, hotkeyInfo } = visibilityHook;
  const isVisualizerOpen = visibility.visualizer;

  // Map hotkey info to area configs
  const areaConfigs: AreaConfig[] = [
    {
      key: "player",
      label: "Player",
      hotkeyInfo: hotkeyInfo.find((h) => h.key === "P") || {
        key: "P",
        description: "[P]layer",
      },
    },
    {
      key: "footer",
      label: "? help",
      hotkeyInfo: hotkeyInfo.find((h) => h.key === "F") || {
        key: "F",
        description: "[?] help",
      },
    },
    {
      key: "settings",
      label: "Settings",
      hotkeyInfo: hotkeyInfo.find((h) => h.key === "S") || {
        key: "S",
        description: "[S]ettings",
      },
    },
    {
      key: "leftSidebar",
      label: "Left",
      hotkeyInfo: hotkeyInfo.find((h) => h.key === "L") || {
        key: "L",
        description: "[L]eft",
      },
    },
    {
      key: "rightSidebar",
      label: "Right",
      hotkeyInfo: hotkeyInfo.find((h) => h.key === "R") || {
        key: "R",
        description: "[R]ight",
      },
    },
    {
      key: "center",
      label: "Center",
      hotkeyInfo: hotkeyInfo.find((h) => h.key === "C") || {
        key: "C",
        description: "[C]enter",
      },
    },
    {
      key: "visualizer",
      label: "Visualizer",
      hotkeyInfo: hotkeyInfo.find((h) => h.key === "V") || {
        key: "V",
        description: "[V]isualizer",
      },
    },
  ];

  return (
    <div className="flex items-center gap-6 font-mono">
      {/* Hotkey hints */}
      <div className="flex flex-wrap items-center gap-4">
        {hotkeyInfo.map((info, index) => {
          // Determine if this hotkey is for a disabled area
          const areaKey = info.key.toLowerCase();
          const areaMap: Record<string, string> = {
            p: "player",
            f: "footer",
            s: "settings",
            l: "leftSidebar",
            r: "rightSidebar",
            c: "center",
            v: "visualizer",
          };
          const area = areaMap[areaKey];
          const isDisabled =
            isVisualizerOpen &&
            (area === "leftSidebar" ||
              area === "rightSidebar" ||
              area === "center" ||
              area === "settings");

          return (
            <div
              key={index}
              className={`flex items-center gap-2 text-[10px] text-black dark:text-white whitespace-nowrap ${
                isDisabled ? "opacity-30" : "opacity-60"
              }`}
            >
              <kbd
                className={`px-1.5 py-0.5 rounded text-black dark:text-white ${
                  isDisabled ? "opacity-30" : "opacity-80"
                }`}
              >
                {info.key}
              </kbd>
              <span>{info.description}</span>
            </div>
          );
        })}
      </div>

      {/* Toggle buttons with hints */}
      <div className="flex items-center gap-2">
        {areaConfigs.map((area) => {
          const isActive = visibility[area.key];
          // Extract the hint part (e.g., "[R]ight" -> "Right" with R highlighted)
          const hintMatch = area.hotkeyInfo.description.match(/\[(\w)\](.+)/);
          const hintKey = hintMatch ? hintMatch[1] : area.hotkeyInfo.key;
          const hintText = hintMatch ? hintMatch[2] : area.label;

          // Gray out controls for leftSidebar, rightSidebar, center, and settings when visualizer is open
          const isDisabled =
            isVisualizerOpen &&
            (area.key === "leftSidebar" ||
              area.key === "rightSidebar" ||
              area.key === "center" ||
              area.key === "settings");

          return (
            <button
              key={area.key}
              onClick={() => !isDisabled && toggleArea(area.key)}
              disabled={isDisabled}
              className={`
                px-3 py-1 text-xs font-mono
                border border-black dark:border-white
                transition-opacity
                ${
                  isDisabled
                    ? "opacity-30 cursor-not-allowed bg-white dark:bg-black text-black dark:text-white"
                    : isActive
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "bg-white dark:bg-black text-black dark:text-white hover:opacity-90"
                }
              `}
            >
              <span className={isActive ? "opacity-100" : "opacity-100"}>
                [{hintKey}]{hintText}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
