import { useEffect, useRef } from "react";

const ENABLE_LOGGING = false;

export interface HotkeyBinding {
  /** Physical key code (e.g., "KeyH", "KeyL") - layout independent */
  code: string;
  /** Logical key (e.g., "h", "j") - for letter keys, used for layout-independent matching */
  key?: string;
  /** Handler function */
  handler: () => void;
  /** Description for display */
  description: string;
  /** Logical key name for display (e.g., "H", "L") */
  displayKey?: string;
}

export interface UseHotkeysOptions {
  /** Whether to prevent default behavior */
  preventDefault?: boolean;
  /** Whether to enable on form tags */
  enableOnFormTags?: boolean;
}

export interface UseHotkeysReturn {
  /** Get all registered hotkeys */
  hotkeys: HotkeyBinding[];
}

/**
 * Generic hotkey hook that uses physical key codes (code) instead of characters (key)
 * This makes it work regardless of keyboard layout (QWERTY, AZERTY, etc.)
 *
 * Uses a direct keydown listener that checks e.code for physical key positions
 */
export function useHotkeys(
  bindings: HotkeyBinding[],
  options: UseHotkeysOptions = {}
): UseHotkeysReturn {
  const { preventDefault = true, enableOnFormTags = true } = options;
  const handlersMapRef = useRef<Map<string, () => void>>(new Map());

  // Update handlers map when bindings change
  useEffect(() => {
    handlersMapRef.current.clear();
    if (ENABLE_LOGGING) {
      console.log("[useHotkeys] Registering hotkeys:", bindings.length);
    }
    bindings.forEach((binding) => {
      // Normalize the code (lowercase, handle modifier combinations)
      const normalizedCode = binding.code.toLowerCase();

      // Store by code (physical position) - for special keys and modifier combos
      handlersMapRef.current.set(normalizedCode, binding.handler);

      // Also store by logical key (e.key) if available - for letter keys, layout-independent
      // This allows "j" to match regardless of physical key position (e.g., KeyY on AZERTY)
      if (binding.key) {
        const normalizedKey = binding.key.toLowerCase();
        handlersMapRef.current.set(normalizedKey, binding.handler);
      }

      if (ENABLE_LOGGING) {
        console.log(
          `[useHotkeys] Registered: ${normalizedCode}${
            binding.key ? ` (key: "${binding.key}")` : ""
          } -> "${binding.description}"`
        );
      }
    });
  }, [bindings]);

  // Register global keydown listener that checks physical key codes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if focus is on form elements (unless enabled)
      if (!enableOnFormTags) {
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable
        ) {
          return;
        }
      }

      // Use e.code for physical key position and e.key for logical character
      const code = e.code.toLowerCase();
      const logicalKey = e.key.toLowerCase();

      // Build modifier string for combination keys
      const modifiers: string[] = [];
      if (e.shiftKey) modifiers.push("shift");
      if (e.ctrlKey) modifiers.push("control");
      if (e.metaKey) modifiers.push("meta");
      if (e.altKey) modifiers.push("alt");

      // Try modifier combination first (if modifiers are pressed)
      // For modifier combos, use code (physical position) for layout-independence
      let handler: (() => void) | undefined;
      let matchedKey: string | undefined;
      if (modifiers.length > 0) {
        const comboKey = `${modifiers.join("+")}+${code}`;
        handler = handlersMapRef.current.get(comboKey);
        if (handler) {
          matchedKey = comboKey;
        }
        // If modifiers are pressed but no explicit modifier combo is registered, ignore the keypress
        // This prevents accidental matches when modifiers are held down
        if (!handler) {
          return;
        }
      } else {
        // Only match simple keys when no modifiers are pressed
        // For single-letter keys, try matching by logical key (e.key) first for layout-independence
        // This allows "j" to match regardless of physical key position
        if (logicalKey.length === 1 && /[a-z]/.test(logicalKey)) {
          if (ENABLE_LOGGING) {
            console.log(
              `[useHotkeys] Trying to match by logical key: "${logicalKey}"`
            );
          }
          handler = handlersMapRef.current.get(logicalKey);
          if (handler) {
            matchedKey = logicalKey;
            if (ENABLE_LOGGING) {
              console.log(
                `[useHotkeys] Matched by logical key: "${logicalKey}"`
              );
            }
          } else {
            if (ENABLE_LOGGING) {
              console.log(
                `[useHotkeys] No handler found for logical key: "${logicalKey}"`
              );
              // Debug: show what keys are registered
              const registeredKeys = Array.from(
                handlersMapRef.current.keys()
              ).filter((k) => k.length === 1);
              console.log(
                `[useHotkeys] Registered single-letter keys:`,
                registeredKeys
              );
            }
          }
        }

        // Fall back to code (physical position) matching for special keys
        if (!handler) {
          handler = handlersMapRef.current.get(code);
          if (handler) {
            matchedKey = code;
          }
        }
      }

      if (handler) {
        if (ENABLE_LOGGING) {
          console.log(
            `[useHotkeys] Key pressed: ${code}${
              modifiers.length > 0 ? ` (modifiers: ${modifiers.join("+")})` : ""
            } -> matched: ${matchedKey}`
          );
        }
        if (preventDefault) {
          e.preventDefault();
        }
        handler();
        if (ENABLE_LOGGING) {
          console.log(`[useHotkeys] Handler executed for: ${matchedKey}`);
        }
      } else {
        // Log unmatched keys for debugging (only if not a common key to reduce noise)
        const commonKeys = [
          "keya",
          "keyb",
          "keyc",
          "keyd",
          "keye",
          "keyf",
          "keyg",
          "keyh",
          "keyi",
          "keyj",
          "keyk",
          "keyl",
          "keym",
          "keyn",
          "keyo",
          "keyp",
          "keyq",
          "keyr",
          "keys",
          "keyt",
          "keyu",
          "keyv",
          "keyw",
          "keyx",
          "keyy",
          "keyz",
        ];
        if (!commonKeys.includes(code) && ENABLE_LOGGING) {
          console.log(
            `[useHotkeys] Key pressed but no handler: ${code}${
              modifiers.length > 0 ? ` (modifiers: ${modifiers.join("+")})` : ""
            }`
          );
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [preventDefault, enableOnFormTags]);

  return {
    hotkeys: bindings,
  };
}

/**
 * Convert logical key string to physical key code
 * Maps logical keys (like "space", "arrowleft") to physical key codes (like "Space", "ArrowLeft")
 */
export function logicalKeyToCode(logicalKey: string): string {
  const normalized = logicalKey.toLowerCase().trim();

  // Special keys that don't follow the KeyX pattern
  const specialKeysMap: Record<string, string> = {
    space: "Space",
    arrowleft: "ArrowLeft",
    arrowright: "ArrowRight",
    arrowup: "ArrowUp",
    arrowdown: "ArrowDown",
    pageup: "PageUp",
    pagedown: "PageDown",
    home: "Home",
    end: "End",
    enter: "Enter",
    escape: "Escape",
    tab: "Tab",
    backspace: "Backspace",
    delete: "Delete",
  };

  if (specialKeysMap[normalized]) {
    return specialKeysMap[normalized];
  }

  // Handle modifier combinations (e.g., "shift+tab")
  if (normalized.includes("+")) {
    const parts = normalized.split("+").map((p) => p.trim());
    const modifiers = parts.slice(0, -1);
    const key = parts[parts.length - 1];

    // Normalize modifiers to lowercase (matching event handler format)
    const modifierCodes = modifiers.map((m) => {
      const modMap: Record<string, string> = {
        shift: "shift",
        ctrl: "control",
        control: "control",
        alt: "alt",
        meta: "meta",
        cmd: "meta",
        command: "meta",
      };
      return modMap[m.toLowerCase()] || m.toLowerCase();
    });

    // Convert the actual key to code, then lowercase for consistency
    const keyCode = logicalKeyToCode(key).toLowerCase();

    // Return combined format in lowercase (matching event handler format)
    return `${modifierCodes.join("+")}+${keyCode}`;
  }

  // Regular letter keys
  if (normalized.length === 1 && /[a-z]/.test(normalized)) {
    return `Key${normalized.toUpperCase()}`;
  }

  // Default: assume it's already a code or try to convert
  return logicalKey;
}

/**
 * Helper to create a hotkey binding with common key codes
 * Maps logical keys to physical key codes
 */
export function createHotkeyBinding(
  logicalKey: string,
  handler: () => void,
  description: string
): HotkeyBinding {
  const code = logicalKeyToCode(logicalKey);
  if (ENABLE_LOGGING) {
    console.log(
      `[useHotkeys] createHotkeyBinding: "${logicalKey}" -> code: "${code}" (${description})`
    );
  }

  // Extract display key from logical key
  let displayKey: string | undefined;
  if (logicalKey.includes("+")) {
    const parts = logicalKey.split("+");
    displayKey = parts[parts.length - 1].toUpperCase();
  } else if (logicalKey.length === 1) {
    displayKey = logicalKey.toUpperCase();
  } else {
    // For special keys, use a readable format
    const displayMap: Record<string, string> = {
      space: "Space",
      arrowleft: "←",
      arrowright: "→",
      arrowup: "↑",
      arrowdown: "↓",
      pageup: "PageUp",
      pagedown: "PageDown",
      home: "Home",
      end: "End",
      tab: "Tab",
    };
    displayKey = displayMap[logicalKey.toLowerCase()] || logicalKey;
  }

  return {
    code,
    key:
      logicalKey.length === 1 && /[a-z]/.test(logicalKey)
        ? logicalKey
        : undefined,
    handler,
    description,
    displayKey,
  };
}

/**
 * Helper to create hotkey bindings from tuples
 * Format: [key, description, handler]
 */
export function createHotkeyBindings(
  tuples: Array<[string, string, () => void]>
): HotkeyBinding[] {
  return tuples.map(([key, description, handler]) =>
    createHotkeyBinding(key, handler, description)
  );
}
