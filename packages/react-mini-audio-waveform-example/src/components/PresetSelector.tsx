import { useMemo, useState } from "react";
import butterchurnPresets from "butterchurn-presets";

interface PresetSelectorProps {
  selectedPresetName?: string | null;
  onPresetHover?: (preset: any) => void;
  onPresetLeave?: () => void;
  onPresetClick?: (preset: any, presetName: string) => void;
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
}: PresetSelectorProps) {
  const { presets, presetKeys } = useMemo(() => loadAndSortPresets(), []);
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div className="mt-1">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="text-xs font-mono text-gray-500 hover:text-gray-900 mb-1 flex items-center gap-1 hover:text-gray-900 cursor-pointer"
      >
        <span>{isCollapsed ? "▶" : "▼"}</span>
        <span>Presets {selectedPresetName && `(${selectedPresetName})`}</span>
      </button>
      {!isCollapsed && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0 text-xs font-mono">
          {presetKeys.map((presetName) => {
            const isSelected = presetName === selectedPresetName;
            return (
              <span
                key={presetName}
                className={`truncate cursor-pointer px-1 py-0.5 ${
                  isSelected
                    ? "text-blue-600 bg-blue-50 font-semibold"
                    : "text-gray-500 hover:text-gray-900"
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
