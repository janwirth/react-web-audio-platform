import { useMemo } from "react";
import butterchurnPresets from "butterchurn-presets";

interface PresetSelectorProps {
  onPresetHover?: (presetName: string) => void;
  onPresetClick?: (preset: any) => void;
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
  onPresetHover,
  onPresetClick,
}: PresetSelectorProps) {
  const { presets, presetKeys } = useMemo(() => loadAndSortPresets(), []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs font-mono mt-1">
      {presetKeys.map((presetName) => (
        <span
          key={presetName}
          className="text-gray-500 hover:text-gray-900 cursor-pointer truncate"
          onClick={() => onPresetClick?.(presets[presetName])}
          onMouseEnter={() => onPresetHover?.(presets[presetName])}
          title={presetName}
        >
          {presetName}
        </span>
      ))}
    </div>
  );
}
