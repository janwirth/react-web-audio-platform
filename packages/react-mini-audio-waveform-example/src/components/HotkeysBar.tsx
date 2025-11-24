import { useHotkeys } from "react-hotkeys-hook";
import { usePlayerContext } from "./player/Player";
import { useCallback, useMemo } from "react";

export interface HotkeyConfig {
  key: string;
  description: string;
  handler?: () => void;
}

interface HotkeysBarProps {
  hotkeys?: HotkeyConfig[];
}

const defaultHotkeys: HotkeyConfig[] = [
  {
    key: "space",
    description: "Play / Pause",
  },
];

export function HotkeysBar({ hotkeys = defaultHotkeys }: HotkeysBarProps) {
  const { audioRef } = usePlayerContext();

  // Set up play/pause handler
  const playPauseHandler = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [audioRef]);

  // Create handlers map
  const handlersMap = useMemo(() => {
    const map = new Map<string, () => void>();
    hotkeys.forEach((hotkey) => {
      if (hotkey.key === "space" && hotkey.description === "Play / Pause") {
        map.set("space", playPauseHandler);
      } else if (hotkey.handler) {
        map.set(hotkey.key, hotkey.handler);
      }
    });
    return map;
  }, [hotkeys, playPauseHandler]);

  // Combine all keys into a single string for registration
  const keysString = useMemo(
    () => hotkeys.map((h) => h.key).join(","),
    [hotkeys]
  );

  // Register all hotkeys with a single hook call
  useHotkeys(
    keysString,
    (e) => {
      e.preventDefault();
      // Normalize key: space key returns " " (space character), not "space"
      let key = e.key.toLowerCase();
      if (key === " ") {
        key = "space";
      }
      const handler = handlersMap.get(key);
      if (handler) {
        handler();
      }
    },
    {
      preventDefault: true,
      enableOnFormTags: false,
    },
    [handlersMap]
  );

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center gap-4 px-4 py-1 overflow-x-auto">
        {hotkeys.map((hotkey, index) => (
          <div
            key={index}
            className="flex items-center gap-2 text-[10px] font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap"
          >
            <kbd className="px-1.5 py-0.5 rounded text-gray-800 dark:text-gray-200">
              {hotkey.key === "space" ? "Space" : hotkey.key}
            </kbd>
            <span>{hotkey.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
