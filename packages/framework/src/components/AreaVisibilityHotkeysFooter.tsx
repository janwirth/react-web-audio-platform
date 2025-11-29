import { useState, useEffect, useRef } from "react";
import { useAreaVisibility, type AreaType } from "@/hooks/useAreaVisibility";
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
    const areaToKey: Record<keyof typeof visibility, string> = {
      header: "H",
      footer: "F",
      leftSidebar: "L",
      rightSidebar: "R",
      center: "C",
      stage: "S",
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
    <div className="w-full font-mono">
      <div className="text-xs text-black dark:text-white mb-2">
        Registered hotkeys:
      </div>
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
            h: "header",
            f: "footer",
            l: "leftSidebar",
            r: "rightSidebar",
            c: "center",
            s: "stage",
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

