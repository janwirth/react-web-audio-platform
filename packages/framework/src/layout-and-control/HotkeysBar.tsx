import { useHotkeys, createHotkeyBinding } from "@/hooks/useHotkeys";
import { usePlayerContext } from "../media/player/Player";
import { useCallback, useMemo } from "react";

export interface HotkeyConfig {
  key: string;
  description: string;
  handler?: () => void;
}

interface HotkeysBarProps {
  hotkeys?: HotkeyConfig[];
  audioRef?: React.RefObject<HTMLAudioElement | null>;
}

const defaultHotkeys: HotkeyConfig[] = [
  {
    key: "space",
    description: "Play / Pause",
  },
  {
    key: "j",
    description: "Scroll down / Move selection down",
  },
  {
    key: "k",
    description: "Scroll up / Move selection up",
  },
  {
    key: "x",
    description: "Toggle selection",
  },
  {
    key: "ArrowUp",
    description: "Scroll up / Move selection up",
  },
  {
    key: "ArrowDown",
    description: "Scroll down / Move selection down",
  },
  {
    key: "PageUp",
    description: "Page up",
  },
  {
    key: "PageDown",
    description: "Page down",
  },
  {
    key: "Home",
    description: "Go to top",
  },
  {
    key: "End",
    description: "Go to bottom",
  },
];

export function HotkeysBar({
  hotkeys = defaultHotkeys,
  audioRef: audioRefProp,
}: HotkeysBarProps) {
  // Try to get audioRef from prop first, then from context if available
  let audioRef: React.RefObject<HTMLAudioElement | null> | null =
    audioRefProp || null;

  // Only try to get from context if not provided as prop
  if (!audioRef) {
    try {
      const context = usePlayerContext();
      audioRef = context?.audioRef || null;
    } catch {
      // Player context not available, that's okay - hotkeys will work without it
    }
  }

  // Set up play/pause handler (only if audioRef is available)
  const playPauseHandler = useCallback(() => {
    if (!audioRef) return;
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [audioRef]);

  // Create hotkey bindings from hotkey configs
  const hotkeyBindings = useMemo(() => {
    return hotkeys
      .filter(
        (hotkey) =>
          hotkey.handler ||
          (hotkey.key === "space" && hotkey.description === "Play / Pause")
      )
      .map((hotkey) => {
        const handler =
          hotkey.key === "space" && hotkey.description === "Play / Pause"
            ? playPauseHandler
            : hotkey.handler!;
        return createHotkeyBinding(hotkey.key, handler, hotkey.description);
      });
  }, [hotkeys, playPauseHandler]);

  // Register all hotkeys using the custom hook
  useHotkeys(hotkeyBindings, {
    preventDefault: true,
    enableOnFormTags: false,
  });

  return (
    <>
      <div className="flex flex-wrap items-center gap-4 px-4 py-1">
        {hotkeyBindings.map((binding, index) => (
          <div
            key={index}
            className="flex items-center gap-2 text-[10px] font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap"
          >
            <kbd className="px-1.5 py-0.5 rounded text-gray-800 dark:text-gray-200">
              {binding.displayKey ||
                binding.code
                  .replace(/key/gi, "")
                  .replace(/arrowleft/gi, "←")
                  .replace(/arrowright/gi, "→")
                  .replace(/arrowup/gi, "↑")
                  .replace(/arrowdown/gi, "↓")
                  .replace(/space/gi, "Space")}
            </kbd>
            <span>{binding.description}</span>
          </div>
        ))}
      </div>
    </>
  );
}
