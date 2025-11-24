import { useHotkeys } from "react-hotkeys-hook";
import { usePlayerContext } from "./player/Player";
import { useCallback, useMemo } from "react";

// Helper component to register a single hotkey
function HotkeyRegistration({
  keyCombo,
  handler,
}: {
  keyCombo: string;
  handler: () => void;
}) {
  useHotkeys(
    keyCombo,
    (e) => {
      e.preventDefault();
      handler();
    },
    {
      preventDefault: true,
      enableOnFormTags: true,
    },
    [handler]
  );
  return null;
}

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

  // Create handlers map - support both simple keys and modifier combinations
  const handlersMap = useMemo(() => {
    const map = new Map<string, () => void>();
    hotkeys.forEach((hotkey) => {
      if (hotkey.key === "space" && hotkey.description === "Play / Pause") {
        map.set("space", playPauseHandler);
      } else if (hotkey.handler) {
        // Store handler by the key string as provided (e.g., "shift+tab", "arrowleft")
        map.set(hotkey.key.toLowerCase(), hotkey.handler);
      }
    });
    return map;
  }, [hotkeys, playPauseHandler]);

  // Get all keys that have handlers, separate simple from modifier combos
  const { simpleKeys, modifierKeys } = useMemo(() => {
    const keysWithHandlers = hotkeys
      .filter(
        (hotkey) =>
          hotkey.handler ||
          (hotkey.key === "space" && hotkey.description === "Play / Pause")
      )
      .map((hotkey) => hotkey.key);

    const simple = keysWithHandlers.filter(
      (k) =>
        !k.includes("+") && !k.toLowerCase().match(/^(arrow|page|home|end)/i)
    );
    const modifier = keysWithHandlers.filter(
      (k) => k.includes("+") || k.toLowerCase().match(/^(arrow|page|home|end)/i)
    );

    return { simpleKeys: simple, modifierKeys: modifier };
  }, [hotkeys]);

  // Register simple keys together
  if (simpleKeys.length > 0) {
    const simpleKeysString = simpleKeys.join(",");
    useHotkeys(
      simpleKeysString,
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
  }

  // Register modifier combinations using helper components
  // This allows us to register multiple hotkeys without violating hook rules

  return (
    <>
      {/* Register modifier key combinations */}
      {modifierKeys.map((keyCombo) => {
        const handler = handlersMap.get(keyCombo.toLowerCase());
        return handler ? (
          <HotkeyRegistration
            key={keyCombo}
            keyCombo={keyCombo}
            handler={handler}
          />
        ) : null;
      })}

      <div className="flex flex-wrap items-center gap-4 px-4 py-1">
        {hotkeys.map((hotkey, index) => (
          <div
            key={index}
            className="flex items-center gap-2 text-[10px] font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap"
          >
            <kbd className="px-1.5 py-0.5 rounded text-gray-800 dark:text-gray-200">
              {hotkey.key === "space"
                ? "Space"
                : hotkey.key
                    .replace(/\+/g, " + ")
                    .replace(/arrowleft/gi, "←")
                    .replace(/arrowright/gi, "→")
                    .replace(/arrowup/gi, "↑")
                    .replace(/arrowdown/gi, "↓")}
            </kbd>
            <span>{hotkey.description}</span>
          </div>
        ))}
      </div>
    </>
  );
}
