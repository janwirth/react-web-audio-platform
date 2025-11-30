import { useColorScheme, type ColorScheme } from "../hooks/useColorScheme";

export function DarkModeToggle({ emojiOnly = true }: { emojiOnly?: boolean }) {
  const { mode, isDark, setColorScheme } = useColorScheme();

  const cycleMode = () => {
    // Cycle through: auto -> light -> dark -> auto
    if (mode === "auto") {
      setColorScheme("light");
    } else if (mode === "light") {
      setColorScheme("dark");
    } else {
      setColorScheme("auto");
    }
  };
  const getEmojiLabel = () => {
    if (mode === "auto") {
      return isDark ? "🌓" : "🌓";
    }
    return mode === "dark" ? "🌙" : "☀️";
  };

  const getLabel = () => {
    if (emojiOnly) {
      return getEmojiLabel();
    }
    if (mode === "auto") {
      return isDark ? "🌓 Auto (Dark)" : "🌓 Auto (Light)";
    }
    return mode === "dark" ? "🌙 Dark" : "☀️ Light";
  };

  const getAriaLabel = () => {
    if (mode === "auto") {
      return "Switch to light mode (currently auto)";
    }
    if (mode === "light") {
      return "Switch to dark mode (currently light)";
    }
    return "Switch to auto mode (currently dark)";
  };

  return (
    <button
      onClick={cycleMode}
      className="text-xs font-mono text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100  flex items-center gap-1 cursor-pointer transition-colors"
      aria-label={getAriaLabel()}
    >
      {getLabel()}
    </button>
  );
}
