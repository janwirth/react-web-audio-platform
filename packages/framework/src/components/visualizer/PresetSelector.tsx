import { useMemo, useState, useRef, useEffect } from "react";
import butterchurnPresets from "butterchurn-presets";
import { TableVirtualizer } from "../TableVirtualizer";
import { Column } from "../Column";

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
  const [previewingPresetName, setPreviewingPresetName] = useState<
    string | null
  >(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handlePresetClick = (preset: any, presetName: string) => {
    onPresetClick?.(preset, presetName);
    setIsCollapsed(true); // Auto-close when preset is selected
  };

  const handlePresetHover = (preset: any, presetName: string) => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Set previewing state immediately for UI feedback
    setPreviewingPresetName(presetName);

    // Debounce the actual preview call
    hoverTimeoutRef.current = setTimeout(() => {
      onPresetHover?.(preset);
    }, 150);
  };

  const handlePresetLeave = () => {
    // Clear timeout and reset previewing state
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setPreviewingPresetName(null);
    onPresetLeave?.();
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
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
            <span>
              Presets {selectedPresetName && `(${selectedPresetName})`}
            </span>
          </button>
        </div>
      </div>
      {!isCollapsed && (
        <div className="fixed top-0 right-0 w-1/3 h-full bg-white/70 dark:bg-black/70 z-50 backdrop-blur-2xl">
          <div className="h-full p-4 flex flex-col">
            <TableVirtualizer
              items={presetKeys}
              itemHeight={28}
              renderItem={(presetName: string) => {
                const isSelected = presetName === selectedPresetName;
                const isPreviewing = presetName === previewingPresetName;
                return (
                  <div
                    className={`flex flex-row items-center cursor-pointer px-2 py-1 transition-colors ${
                      isSelected
                        ? "text-blue-600 font-semibold opacity-100 dark:text-blue-400"
                        : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 opacity-60 hover:opacity-100 dark:opacity-60 dark:hover:opacity-100"
                    }`}
                    onClick={() =>
                      handlePresetClick(presets[presetName], presetName)
                    }
                    onMouseEnter={() =>
                      handlePresetHover(presets[presetName], presetName)
                    }
                    onMouseLeave={handlePresetLeave}
                    title={presetName}
                  >
                    <Column className="flex-1 min-w-0">
                      <span className="truncate">{presetName}</span>
                    </Column>
                    {isPreviewing && (
                      <span className="text-xs font-mono opacity-60 ml-2 whitespace-nowrap">
                        preview
                      </span>
                    )}
                  </div>
                );
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
