import { useMemo, useState } from "react";
import butterchurnPresets from "butterchurn-presets";

interface PresetSelectorProps {
  selectedPresetName?: string | null;
  onPresetHover?: (preset: any) => void;
  onPresetLeave?: () => void;
  onPresetClick?: (preset: any, presetName: string) => void;
  onPrevPreset?: () => void;
  onNextPreset?: () => void;
}

// Load and sort presets just like in butter.html
function loadAndSortPresets() {
  const allPresets = butterchurnPresets.getPresets();

  // Convert to pairs, sort by key (case-insensitive), convert back to object
  const sortedPairs = Object.entries(allPresets).sort(([a], [b]) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );

  const sortedPresets: Record<string, any> = {};
  const presetKeys: string[] = [];

  sortedPairs.forEach(([key, value]) => {
    sortedPresets[key] = value;
    presetKeys.push(key);
  });

  return { presets: sortedPresets, presetKeys };
}

export function PresetSelector({
  selectedPresetName,
  onPresetHover,
  onPresetLeave,
  onPresetClick,
  onPrevPreset,
  onNextPreset,
}: PresetSelectorProps) {
  const { presets, presetKeys } = useMemo(() => loadAndSortPresets(), []);
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div className="mt-1">
      <div className="flex items-center gap-2 mb-1">
        {(onPrevPreset || onNextPreset) && (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrevPreset?.();
              }}
              className="text-xs font-mono text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 px-1.5 py-0.5 rounded hover:opacity-75 cursor-pointer transition-colors"
              title="Previous preset"
            >
              prev
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNextPreset?.();
              }}
              className="text-xs font-mono text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 px-1.5 py-0.5 rounded hover:opacity-75 cursor-pointer transition-colors"
              title="Next preset"
            >
              next
            </button>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-xs font-mono text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>{isCollapsed ? "▶" : "▼"}</span>
          <span>Presets {selectedPresetName && `(${selectedPresetName})`}</span>
        </button>
      </div>
      {!isCollapsed && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0 text-xs font-mono">
          {presetKeys.map((presetName) => {
            const isSelected = presetName === selectedPresetName;
            return (
              <span
                key={presetName}
                className={`truncate cursor-pointer px-1 py-0.5 transition-colors ${
                  isSelected
                    ? "text-blue-600 font-semibold opacity-100 dark:text-blue-400"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 opacity-60 hover:opacity-100 dark:opacity-60 dark:hover:opacity-100"
                }`}
                onClick={() => onPresetClick?.(presets[presetName], presetName)}
                onMouseEnter={() => onPresetHover?.(presets[presetName])}
                onMouseLeave={() => onPresetLeave?.()}
                title={presetName}
              >
                {presetName}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
