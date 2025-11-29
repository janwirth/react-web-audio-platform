import type { Meta, StoryObj } from "@storybook/react";
import { useState, useCallback, useEffect, useMemo } from "react";
import {
  useHotkeys,
  createHotkeyBindings,
  HotkeyBinding,
} from "@/hooks/useHotkeys";
import { GridLayout } from "@/components/GridLayout";
import { PanelEventBusProvider } from "@/hooks/usePanelEvent";
import { HotkeyHint } from "@/components/HotkeyHint";
import { useAreaVisibility } from "@/hooks/useAreaVisibility";
import { AreaVisibilityHotkeysFooter } from "@/components/AreaVisibilityHotkeysFooter";
import { Player } from "@/components/player/Player";
import { PlayerUI } from "@/components/player/PlayerUI";
import { Visualizer } from "@/components/visualizer/Visualizer";
import { TableVirtualizer } from "@/components/TableVirtualizer";
import { HotkeyDebuggerSection } from "@/components/HotkeyDebuggerSection";
import { CenterAreaContent } from "@/layout-app/Data";
import { Queue } from "@/components/player/Queue";
import { Tracklist } from "@/components/Tracklist";

const meta = {
  title: "Stories/Hotkeys",
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function HotkeyTester() {
  const [lastPressed, setLastPressed] = useState<string>("None");
  const [pressCount, setPressCount] = useState<Record<string, number>>({});
  const [counter, setCounter] = useState(0);

  const incrementCounter = useCallback(() => {
    setCounter((prev) => prev + 1);
  }, []);

  const decrementCounter = useCallback(() => {
    setCounter((prev) => prev - 1);
  }, []);

  const resetCounter = useCallback(() => {
    setCounter(0);
  }, []);

  // Create various hotkey bindings
  const bindings: HotkeyBinding[] = createHotkeyBindings([
    // Letter keys
    [
      "h",
      "Say Hello",
      () => {
        setLastPressed("H - Hello");
        setPressCount((prev) => ({
          ...prev,
          H: (prev.H || 0) + 1,
        }));
      },
    ],
    [
      "j",
      "Jump",
      () => {
        setLastPressed("J - Jump");
        setPressCount((prev) => ({
          ...prev,
          J: (prev.J || 0) + 1,
        }));
      },
    ],
    [
      "k",
      "Kick",
      () => {
        setLastPressed("K - Kick");
        setPressCount((prev) => ({
          ...prev,
          K: (prev.K || 0) + 1,
        }));
      },
    ],
    [
      "x",
      "Exit",
      () => {
        setLastPressed("X - Exit");
        setPressCount((prev) => ({
          ...prev,
          X: (prev.X || 0) + 1,
        }));
      },
    ],

    // Arrow keys
    ["arrowup", "Increment counter", incrementCounter],
    ["arrowdown", "Decrement counter", decrementCounter],
    ["arrowleft", "Reset counter", resetCounter],
    [
      "arrowright",
      "Right arrow",
      () => {
        setLastPressed("→ - Right arrow");
        setPressCount((prev) => ({
          ...prev,
          "→": (prev["→"] || 0) + 1,
        }));
      },
    ],

    // Special keys
    [
      "space",
      "Space",
      () => {
        setLastPressed("Space - Space bar");
        setPressCount((prev) => ({
          ...prev,
          Space: (prev.Space || 0) + 1,
        }));
      },
    ],
    [
      "tab",
      "Tab",
      () => {
        setLastPressed("Tab - Tab key");
        setPressCount((prev) => ({
          ...prev,
          Tab: (prev.Tab || 0) + 1,
        }));
      },
    ],
    [
      "enter",
      "Enter",
      () => {
        setLastPressed("Enter - Enter key");
        setPressCount((prev) => ({
          ...prev,
          Enter: (prev.Enter || 0) + 1,
        }));
      },
    ],
    [
      "escape",
      "Escape",
      () => {
        setLastPressed("Escape - Escape key");
        setPressCount((prev) => ({
          ...prev,
          Escape: (prev.Escape || 0) + 1,
        }));
      },
    ],

    // Page navigation
    [
      "pageup",
      "Page up",
      () => {
        setLastPressed("PageUp - Page up");
        setPressCount((prev) => ({
          ...prev,
          PageUp: (prev.PageUp || 0) + 1,
        }));
      },
    ],
    [
      "pagedown",
      "Page down",
      () => {
        setLastPressed("PageDown - Page down");
        setPressCount((prev) => ({
          ...prev,
          PageDown: (prev.PageDown || 0) + 1,
        }));
      },
    ],
    [
      "home",
      "Home",
      () => {
        setLastPressed("Home - Home key");
        setPressCount((prev) => ({
          ...prev,
          Home: (prev.Home || 0) + 1,
        }));
      },
    ],
    [
      "end",
      "End",
      () => {
        setLastPressed("End - End key");
        setPressCount((prev) => ({
          ...prev,
          End: (prev.End || 0) + 1,
        }));
      },
    ],

    // Modifier combinations
    [
      "shift+tab",
      "Shift Tab",
      () => {
        setLastPressed("Shift+Tab - Shift Tab");
        setPressCount((prev) => ({
          ...prev,
          "Shift+Tab": (prev["Shift+Tab"] || 0) + 1,
        }));
      },
    ],
    [
      "ctrl+h",
      "Control H",
      () => {
        setLastPressed("Ctrl+H - Control H");
        setPressCount((prev) => ({
          ...prev,
          "Ctrl+H": (prev["Ctrl+H"] || 0) + 1,
        }));
      },
    ],
  ]);

  const { hotkeys } = useHotkeys(bindings, {
    preventDefault: true,
    enableOnFormTags: false,
  });

  // Create sets of registered hotkey codes and keys for matching
  const registeredCodes = useMemo(() => {
    const codes = new Set<string>();
    const keys = new Set<string>();
    hotkeys.forEach((binding) => {
      codes.add(binding.code.toLowerCase());
      // Also store by logical key if available (for letter keys)
      if (binding.key) {
        keys.add(binding.key.toLowerCase());
      }
    });
    return { codes, keys };
  }, [hotkeys]);

  // Log every key press and whether it matches
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if focus is on form elements
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      // Skip modifier keys themselves (Shift, Control, Alt, Meta)
      const modifierKeys = [
        "ShiftLeft",
        "ShiftRight",
        "ControlLeft",
        "ControlRight",
        "AltLeft",
        "AltRight",
        "MetaLeft",
        "MetaRight",
      ];
      if (modifierKeys.includes(e.code)) {
        return;
      }

      const code = e.code.toLowerCase();
      const logicalKey = e.key.toLowerCase();

      // Build modifier string
      const modifiers: string[] = [];
      if (e.shiftKey) modifiers.push("shift");
      if (e.ctrlKey) modifiers.push("control");
      if (e.metaKey) modifiers.push("meta");
      if (e.altKey) modifiers.push("alt");

      // Check for match (matching hook's logic)
      let matched = false;
      let matchedKey: string | undefined;

      // Try modifier combination first (if modifiers are pressed)
      if (modifiers.length > 0) {
        const comboKey = `${modifiers.join("+")}+${code}`;
        if (registeredCodes.codes.has(comboKey)) {
          matched = true;
          matchedKey = comboKey;
        }
      }

      // Fall back to simple key matching
      if (!matched) {
        // For single-letter keys, try matching by logical key (e.key) first for layout-independence
        if (logicalKey.length === 1 && /[a-z]/.test(logicalKey)) {
          if (registeredCodes.keys.has(logicalKey)) {
            matched = true;
            matchedKey = logicalKey;
          }
        }

        // Fall back to code (physical position) matching for special keys
        if (!matched) {
          if (registeredCodes.codes.has(code)) {
            matched = true;
            matchedKey = code;
          }
        }
      }

      // Format key display - prioritize e.key (what user typed) over e.code (physical position)
      const keyDisplay = e.key.length === 1 ? `"${e.key}"` : e.key;
      const codeInfo = e.code !== e.key ? ` (code: ${e.code})` : "";

      if (matched) {
        console.log(
          `[HotkeyTester] ✅ MATCH: ${keyDisplay}${codeInfo}${
            modifiers.length > 0
              ? ` with modifiers: ${modifiers.join("+")}`
              : ""
          } -> matched: ${matchedKey}`
        );
      } else {
        console.log(
          `[HotkeyTester] ❌ NO MATCH: ${keyDisplay}${codeInfo}${
            modifiers.length > 0
              ? ` with modifiers: ${modifiers.join("+")}`
              : ""
          }`
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [registeredCodes]);

  return (
    <div className="p-8 font-mono max-w-2xl">
      <h2 className="text-xl font-bold mb-6 text-black dark:text-white">
        Hotkey Handler Test
      </h2>

      <div className="mb-6 p-4 border border-black dark:border-white">
        <div className="mb-2 text-sm text-black dark:text-white opacity-60">
          Last pressed:
        </div>
        <div className="text-lg font-bold text-black dark:text-white">
          {lastPressed}
        </div>
      </div>

      <div className="mb-6 p-4 border border-black dark:border-white">
        <div className="mb-2 text-sm text-black dark:text-white opacity-60">
          Counter: {counter}
        </div>
        <div className="text-xs text-black dark:text-white opacity-60">
          Use ↑ ↓ to change, ← to reset
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-bold mb-3 text-black dark:text-white">
          Registered Hotkeys ({hotkeys.length}):
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {hotkeys.map((binding, index) => {
            const count = pressCount[binding.displayKey || binding.code] || 0;
            return (
              <div
                key={index}
                className="flex items-center justify-between p-2 border border-black dark:border-white opacity-60 hover:opacity-100"
              >
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 rounded text-black dark:text-white opacity-80">
                    {binding.displayKey ||
                      binding.code
                        .replace(/key/gi, "")
                        .replace(/arrowleft/gi, "←")
                        .replace(/arrowright/gi, "→")
                        .replace(/arrowup/gi, "↑")
                        .replace(/arrowdown/gi, "↓")
                        .replace(/space/gi, "Space")}
                  </kbd>
                  <span className="text-black dark:text-white">
                    {binding.description}
                  </span>
                </div>
                {count > 0 && (
                  <span className="text-black dark:text-white opacity-60">
                    ({count}x)
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-xs text-black dark:text-white opacity-60">
        <p>
          Press any key to test. Every key press is logged to the console with
          match status (✅ MATCH or ❌ NO MATCH).
        </p>
        <p className="mt-2">
          Note: Focus must be outside form elements for hotkeys to work.
        </p>
        <p className="mt-2 font-bold">
          Check the browser console to see all key presses and matches.
        </p>
      </div>
    </div>
  );
}

export const Default: Story = {
  render: () => <HotkeyTester />,
};

function HotkeyWithFormElements() {
  const [lastPressed, setLastPressed] = useState<string>("None");
  const [enableOnFormTags, setEnableOnFormTags] = useState(false);

  const bindings: HotkeyBinding[] = createHotkeyBindings([
    [
      "h",
      "Press H (works in inputs when enabled)",
      () => setLastPressed("H pressed"),
    ],
    [
      "j",
      "Press J (works in inputs when enabled)",
      () => setLastPressed("J pressed"),
    ],
  ]);

  useHotkeys(bindings, {
    preventDefault: true,
    enableOnFormTags,
  });

  return (
    <div className="p-8 font-mono max-w-2xl">
      <h2 className="text-xl font-bold mb-6 text-black dark:text-white">
        Hotkeys with Form Elements
      </h2>

      <div className="mb-4">
        <label className="flex items-center gap-2 text-black dark:text-white">
          <input
            type="checkbox"
            checked={enableOnFormTags}
            onChange={(e) => setEnableOnFormTags(e.target.checked)}
            className="w-4 h-4"
          />
          <span>Enable hotkeys in form elements</span>
        </label>
      </div>

      <div className="mb-6 p-4 border border-black dark:border-white">
        <div className="mb-2 text-sm text-black dark:text-white opacity-60">
          Last pressed:
        </div>
        <div className="text-lg font-bold text-black dark:text-white">
          {lastPressed}
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Type here and try pressing H or J"
          className="w-full p-2 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white"
        />
      </div>

      <div className="mb-4">
        <textarea
          placeholder="Or type here..."
          className="w-full p-2 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white"
          rows={3}
        />
      </div>

      <div className="text-xs text-black dark:text-white opacity-60">
        <p>
          When "Enable hotkeys in form elements" is unchecked, hotkeys won't
          work when typing in inputs.
        </p>
        <p className="mt-2">
          When checked, hotkeys will work even when focused on form elements.
        </p>
      </div>
    </div>
  );
}

export const WithFormElements: Story = {
  render: () => <HotkeyWithFormElements />,
};

function HotkeyModifierCombinations() {
  const [lastPressed, setLastPressed] = useState<string>("None");

  const bindings: HotkeyBinding[] = createHotkeyBindings([
    ["shift+tab", "Shift Tab", () => setLastPressed("Shift+Tab")],
    ["ctrl+h", "Control H", () => setLastPressed("Ctrl+H")],
    ["ctrl+j", "Control J", () => setLastPressed("Ctrl+J")],
    ["alt+x", "Alt X", () => setLastPressed("Alt+X")],
    [
      "meta+k",
      "Meta K (Cmd+K on Mac)",
      () => setLastPressed("Meta+K (Cmd+K on Mac)"),
    ],
  ]);

  const { hotkeys } = useHotkeys(bindings, {
    preventDefault: true,
    enableOnFormTags: false,
  });

  return (
    <div className="p-8 font-mono max-w-2xl">
      <h2 className="text-xl font-bold mb-6 text-black dark:text-white">
        Modifier Key Combinations
      </h2>

      <div className="mb-6 p-4 border border-black dark:border-white">
        <div className="mb-2 text-sm text-black dark:text-white opacity-60">
          Last pressed:
        </div>
        <div className="text-lg font-bold text-black dark:text-white">
          {lastPressed}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-bold mb-3 text-black dark:text-white">
          Registered Modifier Combinations:
        </h3>
        <div className="space-y-2 text-xs">
          {hotkeys.map((binding, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 border border-black dark:border-white opacity-60 hover:opacity-100"
            >
              <kbd className="px-1.5 py-0.5 rounded text-black dark:text-white opacity-80">
                {binding.displayKey ||
                  binding.code.replace(/key/gi, "").replace(/\+/g, " + ")}
              </kbd>
              <span className="text-black dark:text-white">
                {binding.description}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-black dark:text-white opacity-60">
        <p>Try pressing modifier combinations:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Shift + Tab</li>
          <li>Ctrl + H (or Cmd + H on Mac)</li>
          <li>Ctrl + J (or Cmd + J on Mac)</li>
          <li>Alt + X</li>
          <li>Meta + K (Cmd + K on Mac, Ctrl + K on Windows/Linux)</li>
        </ul>
      </div>
    </div>
  );
}

export const ModifierCombinations: Story = {
  render: () => <HotkeyModifierCombinations />,
};

function HotkeyTesterInGridLayout() {
  const [lastPressed, setLastPressed] = useState<string>("None");
  const [pressCount, setPressCount] = useState<Record<string, number>>({});
  const [counter, setCounter] = useState(0);
  const [isToggled, setIsToggled] = useState(false);
  const [activeHotkey, setActiveHotkey] = useState<string | null>(null);
  const [recentPresses, setRecentPresses] = useState<
    Array<{ key: string; code: string; matched: boolean; time: number }>
  >([]);

  const incrementCounter = useCallback(() => {
    setCounter((prev) => prev + 1);
  }, []);

  const decrementCounter = useCallback(() => {
    setCounter((prev) => prev - 1);
  }, []);

  const resetCounter = useCallback(() => {
    setCounter(0);
  }, []);

  // Create various hotkey bindings
  const bindings: HotkeyBinding[] = createHotkeyBindings([
    // Letter keys
    [
      "h",
      "Say Hello",
      () => {
        setLastPressed("H - Hello");
        setActiveHotkey("H");
        setPressCount((prev) => ({
          ...prev,
          H: (prev.H || 0) + 1,
        }));
        setTimeout(() => setActiveHotkey(null), 300);
      },
    ],
    [
      "j",
      "Jump",
      () => {
        setLastPressed("J - Jump");
        setActiveHotkey("J");
        setPressCount((prev) => ({
          ...prev,
          J: (prev.J || 0) + 1,
        }));
        setTimeout(() => setActiveHotkey(null), 300);
      },
    ],
    [
      "k",
      "Kick",
      () => {
        setLastPressed("K - Kick");
        setActiveHotkey("K");
        setPressCount((prev) => ({
          ...prev,
          K: (prev.K || 0) + 1,
        }));
        setTimeout(() => setActiveHotkey(null), 300);
      },
    ],
    [
      "x",
      "Exit",
      () => {
        setLastPressed("X - Exit");
        setActiveHotkey("X");
        setPressCount((prev) => ({
          ...prev,
          X: (prev.X || 0) + 1,
        }));
        setTimeout(() => setActiveHotkey(null), 300);
      },
    ],
    [
      "t",
      "Toggle feature",
      () => {
        setIsToggled((prev) => {
          const newValue = !prev;
          setLastPressed(`T - Toggle (${newValue ? "ON" : "OFF"})`);
          return newValue;
        });
        setActiveHotkey("T");
        setPressCount((prev) => ({
          ...prev,
          T: (prev.T || 0) + 1,
        }));
        setTimeout(() => setActiveHotkey(null), 300);
      },
    ],

    // Arrow keys
    [
      "arrowup",
      "Increment counter",
      () => {
        incrementCounter();
        setActiveHotkey("↑");
        setTimeout(() => setActiveHotkey(null), 300);
      },
    ],
    [
      "arrowdown",
      "Decrement counter",
      () => {
        decrementCounter();
        setActiveHotkey("↓");
        setTimeout(() => setActiveHotkey(null), 300);
      },
    ],
    [
      "arrowleft",
      "Reset counter",
      () => {
        resetCounter();
        setActiveHotkey("←");
        setTimeout(() => setActiveHotkey(null), 300);
      },
    ],
    [
      "arrowright",
      "Right arrow",
      () => {
        setLastPressed("→ - Right arrow");
        setActiveHotkey("→");
        setPressCount((prev) => ({
          ...prev,
          "→": (prev["→"] || 0) + 1,
        }));
        setTimeout(() => setActiveHotkey(null), 300);
      },
    ],

    // Special keys
    [
      "space",
      "Space",
      () => {
        setLastPressed("Space - Space bar");
        setActiveHotkey("Space");
        setPressCount((prev) => ({
          ...prev,
          Space: (prev.Space || 0) + 1,
        }));
        setTimeout(() => setActiveHotkey(null), 300);
      },
    ],
    [
      "tab",
      "Tab",
      () => {
        setLastPressed("Tab - Tab key");
        setActiveHotkey("Tab");
        setPressCount((prev) => ({
          ...prev,
          Tab: (prev.Tab || 0) + 1,
        }));
        setTimeout(() => setActiveHotkey(null), 300);
      },
    ],
    [
      "enter",
      "Enter",
      () => {
        setLastPressed("Enter - Enter key");
        setActiveHotkey("Enter");
        setPressCount((prev) => ({
          ...prev,
          Enter: (prev.Enter || 0) + 1,
        }));
        setTimeout(() => setActiveHotkey(null), 300);
      },
    ],
    [
      "escape",
      "Escape",
      () => {
        setLastPressed("Escape - Escape key");
        setActiveHotkey("Escape");
        setPressCount((prev) => ({
          ...prev,
          Escape: (prev.Escape || 0) + 1,
        }));
        setTimeout(() => setActiveHotkey(null), 300);
      },
    ],
  ]);

  const { hotkeys } = useHotkeys(bindings, {
    preventDefault: true,
    enableOnFormTags: false,
  });

  // Create sets of registered hotkey codes and keys for matching
  const registeredCodes = useMemo(() => {
    const codes = new Set<string>();
    const keys = new Set<string>();
    hotkeys.forEach((binding) => {
      codes.add(binding.code.toLowerCase());
      if (binding.key) {
        keys.add(binding.key.toLowerCase());
      }
    });
    return { codes, keys };
  }, [hotkeys]);

  // Log every key press and track recent presses
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if focus is on form elements
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      // Skip modifier keys themselves
      const modifierKeys = [
        "ShiftLeft",
        "ShiftRight",
        "ControlLeft",
        "ControlRight",
        "AltLeft",
        "AltRight",
        "MetaLeft",
        "MetaRight",
      ];
      if (modifierKeys.includes(e.code)) {
        return;
      }

      const code = e.code.toLowerCase();
      const logicalKey = e.key.toLowerCase();

      // Build modifier string
      const modifiers: string[] = [];
      if (e.shiftKey) modifiers.push("shift");
      if (e.ctrlKey) modifiers.push("control");
      if (e.metaKey) modifiers.push("meta");
      if (e.altKey) modifiers.push("alt");

      // Check for match
      let matched = false;

      if (modifiers.length > 0) {
        const comboKey = `${modifiers.join("+")}+${code}`;
        if (registeredCodes.codes.has(comboKey)) {
          matched = true;
        }
      }

      if (!matched) {
        if (logicalKey.length === 1 && /[a-z]/.test(logicalKey)) {
          if (registeredCodes.keys.has(logicalKey)) {
            matched = true;
          }
        }

        if (!matched) {
          if (registeredCodes.codes.has(code)) {
            matched = true;
          }
        }
      }

      // Add to recent presses (keep last 10)
      const keyDisplay = e.key.length === 1 ? `"${e.key}"` : e.key;
      setRecentPresses((prev) => {
        const newPresses = [
          {
            key: keyDisplay,
            code: e.code,
            matched,
            time: Date.now(),
          },
          ...prev,
        ];
        return newPresses.slice(0, 10);
      });
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [registeredCodes]);

  const centerContent = (
    <div className="w-full font-mono">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-xs text-black dark:text-white">Last: </span>
            <span className="text-sm font-bold text-black dark:text-white">
              {lastPressed}
            </span>
          </div>
          <div>
            <span className="text-xs text-black dark:text-white">
              Counter:{" "}
            </span>
            <span className="text-sm font-bold text-black dark:text-white">
              {counter}
            </span>
          </div>
          <div>
            <span className="text-xs text-black dark:text-white">Toggle: </span>
            <span className="text-sm font-bold text-black dark:text-white">
              {isToggled ? "ON" : "OFF"}
            </span>
          </div>
        </div>
        <div className="text-xs text-black dark:text-white">
          {hotkeys.length} hotkeys registered
        </div>
      </div>

      {/* Recent key presses */}
      <div className="mb-2">
        <div className="text-xs text-black dark:text-white mb-1">
          Recent presses:
        </div>
        <div className="flex flex-wrap gap-1">
          {recentPresses.map((press, index) => (
            <HotkeyHint key={index} matched={press.matched}>
              {press.matched ? "✅" : "❌"} {press.key}
              {press.code !== press.key && ` (${press.code})`}
            </HotkeyHint>
          ))}
        </div>
      </div>
    </div>
  );

  const footerContent = (
    <div className="w-full font-mono">
      {/* Registered hotkeys */}
      <div>
        <div className="text-xs text-black dark:text-white mb-1">
          Registered hotkeys:
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {hotkeys.map((binding, index) => {
            const count = pressCount[binding.displayKey || binding.code] || 0;
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
            // For toggle hotkey, show as active when toggle is ON
            const isToggleActive = displayKey === "T" && isToggled;
            return (
              <HotkeyHint
                key={index}
                active={isActive || isToggleActive}
                onClick={binding.handler}
              >
                <span className="flex items-center gap-1.5">
                  <kbd>{displayKey}</kbd>
                  <span>
                    {binding.description}
                    {displayKey === "T" && ` (${isToggled ? "ON" : "OFF"})`}
                  </span>
                  {count > 0 && <span>({count}x)</span>}
                </span>
              </HotkeyHint>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <PanelEventBusProvider>
      <GridLayout
        header={{
          render: (
            <div className="text-black dark:text-white">
              Hotkey Testing in GridLayout
            </div>
          ),
          visible: true,
        }}
        footer={{
          render: footerContent,
          visible: true,
        }}
        center={{
          render: (
            <div className="p-8 text-black dark:text-white">
              <h2 className="text-xl font-bold mb-4">Press any key to test</h2>
              <p className="text-sm mb-4">
                Hotkey indicators are shown below. Check the console for
                detailed logs.
              </p>
              <div className="space-y-2 text-xs mb-6">
                <p>• Press letter keys (H, J, K, X, T) to test</p>
                <p>• Use arrow keys (↑ ↓ ← →) to control counter</p>
                <p>• Press Space, Tab, Enter, Escape for special keys</p>
                <p>• Press T to toggle the feature on/off</p>
              </div>
              {centerContent}
            </div>
          ),
          visible: true,
        }}
      />
    </PanelEventBusProvider>
  );
}

export const InGridLayout: Story = {
  render: () => <HotkeyTesterInGridLayout />,
  parameters: {
    layout: "fullscreen",
  },
};

function AreaVisibilityHotkeys() {
  const visibilityHook = useAreaVisibility({
    header: true,
    footer: true,
    leftSidebar: true,
    rightSidebar: true,
    center: true,
    stage: true,
  });
  const { visibility } = visibilityHook;

  return (
    <PanelEventBusProvider>
      <GridLayout
        header={{
          render: (
            <div className="text-black dark:text-white font-mono">
              Area Visibility Hotkeys
            </div>
          ),
          visible: visibility.header,
        }}
        footer={{
          render: (
            <AreaVisibilityHotkeysFooter visibilityHook={visibilityHook} />
          ),
          visible: visibility.footer,
        }}
        leftSidebar={{
          render: (
            <div className="text-black dark:text-white font-mono p-4">
              <div className="text-sm font-bold mb-2">Left Sidebar</div>
              <div className="text-xs opacity-60">
                Press L to toggle visibility
              </div>
            </div>
          ),
          focusable: visibility.leftSidebar,
          visible: visibility.leftSidebar,
        }}
        rightSidebar={{
          render: (
            <div className="text-black dark:text-white font-mono p-4">
              <div className="text-sm font-bold mb-2">Right Sidebar</div>
              <div className="text-xs opacity-60">
                Press R to toggle visibility
              </div>
            </div>
          ),
          focusable: visibility.rightSidebar,
          visible: visibility.rightSidebar,
        }}
        center={{
          render: (
            <div className="p-8 text-black dark:text-white font-mono">
              <h2 className="text-xl font-bold mb-4">
                Area Visibility Hotkeys
              </h2>
              <p className="text-sm mb-4">
                Use hotkeys to toggle visibility of different layout areas:
              </p>
              <div className="space-y-2 text-xs mb-6">
                <p>• Press H to toggle Header</p>
                <p>• Press F to toggle Footer</p>
                <p>• Press L to toggle Left Sidebar</p>
                <p>• Press R to toggle Right Sidebar</p>
                <p>• Press C to toggle Center</p>
                <p>• Press S to toggle Stage</p>
              </div>
              <div className="text-xs opacity-60">
                <p>
                  Hotkey buttons in the footer show current state (ON/OFF) and
                  can be clicked to toggle.
                </p>
              </div>
            </div>
          ),
          focusable: visibility.center,
          visible: visibility.center,
        }}
        stage={{
          render: (
            <div className="text-black dark:text-white font-mono p-4">
              <div className="text-sm font-bold mb-2">Stage Area</div>
              <div className="text-xs opacity-60">
                Press S to toggle visibility
              </div>
            </div>
          ),
          visible: visibility.stage,
        }}
      />
    </PanelEventBusProvider>
  );
}

export const AreaVisibility: Story = {
  render: () => <AreaVisibilityHotkeys />,
  parameters: {
    layout: "fullscreen",
  },
};

// Sample items for TableVirtualizer
const sampleTableItems = Array.from({ length: 100 }, (_, i) => ({
  id: i,
  title: `Item ${i + 1}`,
  description: `Description for item ${i + 1}`,
  category: `Category ${Math.floor(i / 10) + 1}`,
}));

function VisualizerWithTableLayout() {
  const visibilityHook = useAreaVisibility({
    header: true,
    footer: true,
    leftSidebar: true,
    rightSidebar: true,
    center: true,
    stage: true,
  });
  const { visibility } = visibilityHook;

  return (
    <PanelEventBusProvider>
      <Player>
        <GridLayout
          header={{
            render: (
              <div className="px-2 py-1 w-full">
                {" "}
                <PlayerUI />
              </div>
            ),
            visible: visibility.header,
          }}
          center={{
            render: <Tracklist />,
            focusable: visibility.center,
            visible: visibility.center,
          }}
          footer={{
            render: (
              <AreaVisibilityHotkeysFooter visibilityHook={visibilityHook} />
            ),
            visible: visibility.footer,
          }}
          leftSidebar={{
            render: (
              <HotkeyDebuggerSection panelId="leftSidebar">
                <div className="text-black dark:text-white font-mono p-4">
                  <div className="text-sm font-bold mb-2">Left Sidebar</div>
                  <div className="text-xs opacity-60">
                    Press L to toggle visibility
                  </div>
                </div>
              </HotkeyDebuggerSection>
            ),
            focusable: visibility.leftSidebar,
            visible: visibility.leftSidebar,
          }}
          rightSidebar={{
            render: <Queue></Queue>,
            focusable: visibility.rightSidebar,
            visible: visibility.rightSidebar,
          }}
          stage={{
            render: <Visualizer height={400} />,
            visible: visibility.stage,
          }}
        />
      </Player>
    </PanelEventBusProvider>
  );
}

export const VisualizerWithTable: Story = {
  render: () => <VisualizerWithTableLayout />,
  parameters: {
    layout: "fullscreen",
  },
};
