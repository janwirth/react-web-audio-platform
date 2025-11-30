import { useState, useEffect, useRef } from "react";
import { useAreaVisibility, type AreaType } from "@/layout-and-control/hooks/useAreaVisibility";
import { HotkeyHint } from "./HotkeyHint";

interface AreaVisibilityHotkeysFooterProps {
  visibilityHook: ReturnType<typeof useAreaVisibility>;
}

export function AreaVisibilityHotkeysFooter({
  visibilityHook,
}: AreaVisibilityHotkeysFooterProps) {
  const { visibility, toggleArea, hotkeyBindings } = visibilityHook;
  const [activeHotkey, setActiveHotkey] = useState<string | null>(null);
  const prevVisibilityRef = useRef(visibility);

  // Track visibility changes to detect which hotkey was pressed
  useEffect(() => {
    const prev = prevVisibilityRef.current;
    const areaToKey: Record<string, string> = {
      player: "P",
      footer: "F",
      settings: "S",
      leftSidebar: "L",
      rightSidebar: "R",
      center: "C",
      visualizer: "V",
    };

    // Find which area changed
    for (const [area, key] of Object.entries(areaToKey)) {
      if (
        prev[area as keyof typeof prev] !==
        visibility[area as keyof typeof visibility]
      ) {
        setActiveHotkey(key);
        setTimeout(() => setActiveHotkey(null), 300);
        break;
      }
    }

    prevVisibilityRef.current = visibility;
  }, [visibility]);

  return (
    <div className="w-full font-mono pt-2">
      <div className="flex flex-wrap gap-2 text-xs">
        {hotkeyBindings.map((binding, index) => {
          const displayKey =
            binding.displayKey ||
            binding.code
              .replace(/key/gi, "")
              .replace(/arrowleft/gi, "←")
              .replace(/arrowright/gi, "→")
              .replace(/arrowup/gi, "↑")
              .replace(/arrowdown/gi, "↓")
              .replace(/space/gi, "Space");
          const isActive = activeHotkey === displayKey;
          const areaKey = displayKey.toLowerCase();
          const areaMap: Record<string, string> = {
            p: "player",
            f: "footer",
            s: "settings",
            l: "leftSidebar",
            r: "rightSidebar",
            c: "center",
            v: "visualizer",
          };
          const area = areaMap[areaKey] as AreaType | undefined;
          const isAreaVisible = area ? visibility[area] : false;

          return (
            <HotkeyHint
              key={index}
              active={isActive || isAreaVisible}
              onClick={() => {
                if (area) {
                  toggleArea(area);
                }
              }}
            >
              <span className="flex items-center gap-1.5">
                <kbd>{displayKey}</kbd>
                <span>
                  {binding.description}
                  {area && ` (${isAreaVisible ? "ON" : "OFF"})`}
                </span>
              </span>
            </HotkeyHint>
          );
        })}
      </div>
    </div>
  );
}
