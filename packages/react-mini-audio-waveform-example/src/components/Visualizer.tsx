import React, { useEffect, useRef, useState } from "react";
import butterchurnPresets from "butterchurn-presets";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
  ContextMenuItem,
} from "./ui/context-menu";
import { Button } from "./ui/button";
import {
  Maximize2Icon,
  Minimize2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GridIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Butterchurn } from "./Butterchurn";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";

// Keep a global registry of audio contexts and source nodes to prevent duplicate connections
const audioContextRegistry = new Map<
  HTMLMediaElement,
  {
    context: AudioContext;
    sourceNode: MediaElementAudioSourceNode;
  }
>();

const STORAGE_KEY = "visualizer-current-preset";
const GRID_SIZE = 9; // 3x3 grid

interface VisualizerProps {
  mediaElement?: HTMLMediaElement;
  className?: string;
}

interface PresetGridProps {
  audioState: {
    context: AudioContext;
    sourceNode: MediaElementAudioSourceNode;
  } | null;
  startIndex: number;
  onPresetSelect: (preset: string) => void;
}

const PresetGrid: React.FC<PresetGridProps> = ({
  audioState,
  startIndex,
  onPresetSelect,
}) => {
  const presets = Object.entries(butterchurnPresets.getPresets());
  const gridPresets = presets.slice(startIndex, startIndex + GRID_SIZE);

  return (
    <div className="grid grid-cols-3 gap-4 w-[900px] max-w-[90vw]">
      {gridPresets.map(([name, preset], idx) => (
        <div
          key={name}
          className="aspect-video relative group cursor-pointer rounded-lg overflow-hidden"
          onClick={() => onPresetSelect(name)}
        >
          {audioState && (
            <Butterchurn
              audioNode={audioState.sourceNode}
              audioContext={audioState.context}
              preset={preset}
              width={300}
              height={169}
            />
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-sm truncate max-w-[90%] px-2">
              {name}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export const Visualizer: React.FC<VisualizerProps> = ({
  mediaElement,
  className,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPreset, setCurrentPreset] = useState<string>(() => {
    // Initialize from localStorage if available
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;

    // Otherwise use first preset
    const presets = butterchurnPresets.getPresets();
    return Object.keys(presets)[0];
  });
  const [gridStartIndex, setGridStartIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [audioState, setAudioState] = useState<{
    context: AudioContext;
    sourceNode: MediaElementAudioSourceNode;
  } | null>(null);

  // Save current preset to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currentPreset);
  }, [currentPreset]);

  // Handle container size changes
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Setup audio context and source node
  useEffect(() => {
    if (!mediaElement) return;

    if (audioContextRegistry.has(mediaElement)) {
      setAudioState(audioContextRegistry.get(mediaElement)!);
    } else {
      const context = new AudioContext();
      const sourceNode = context.createMediaElementSource(mediaElement);
      sourceNode.connect(context.destination);
      const newState = { context, sourceNode };
      audioContextRegistry.set(mediaElement, newState);
      setAudioState(newState);
    }

    // Load initial preset if none selected
    if (!currentPreset) {
      const presets = butterchurnPresets.getPresets();
      const firstPresetName = Object.keys(presets)[0];
      setCurrentPreset(firstPresetName);
    }

    return () => {
      // Only clean up audio context if the media element is being removed
      if (!mediaElement.isConnected) {
        const registry = audioContextRegistry.get(mediaElement);
        if (registry) {
          registry.sourceNode.disconnect();
          registry.context.close();
          audioContextRegistry.delete(mediaElement);
        }
      }
    };
  }, [mediaElement]);

  // Handle fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const loadPreset = (presetName: string) => {
    setCurrentPreset(presetName);
  };

  const navigatePreset = (direction: "next" | "prev") => {
    const presets = Object.keys(butterchurnPresets.getPresets());
    const currentIndex = presets.indexOf(currentPreset);
    let newIndex;

    if (direction === "next") {
      newIndex = currentIndex + 1 >= presets.length ? 0 : currentIndex + 1;
    } else {
      newIndex = currentIndex - 1 < 0 ? presets.length - 1 : currentIndex - 1;
    }

    loadPreset(presets[newIndex]);
  };

  const navigateGrid = (direction: "next" | "prev") => {
    const totalPresets = Object.keys(butterchurnPresets.getPresets()).length;
    const maxStartIndex = Math.max(0, totalPresets - GRID_SIZE);

    if (direction === "next") {
      setGridStartIndex((prev) =>
        prev + GRID_SIZE >= totalPresets ? 0 : prev + GRID_SIZE
      );
    } else {
      setGridStartIndex((prev) =>
        prev - GRID_SIZE < 0 ? maxStartIndex : prev - GRID_SIZE
      );
    }
  };

  // Get current preset object
  const currentPresetObj = currentPreset
    ? butterchurnPresets.getPresets()[currentPreset]
    : null;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative group w-full h-full",
        isFullscreen && "inset-0 z-50 bg-black",
        className
      )}
    >
      <ContextMenu>
        <ContextMenuTrigger>
          {audioState && currentPresetObj && (
            <Butterchurn
              audioNode={audioState.sourceNode}
              audioContext={audioState.context}
              preset={currentPresetObj}
              width={dimensions.width}
              height={dimensions.height}
            />
          )}
        </ContextMenuTrigger>
        <ContextMenuContent>
          {Object.keys(butterchurnPresets.getPresets()).map((presetName) => (
            <ContextMenuItem
              key={presetName}
              onClick={() => loadPreset(presetName)}
              className={`${
                currentPreset === presetName ? "bg-accent" : ""
              } max-w-50 truncate`}
            >
              {presetName}
            </ContextMenuItem>
          ))}
        </ContextMenuContent>
      </ContextMenu>

      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-md p-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigatePreset("prev")}
            className="h-8 w-8"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>

          <span className="text-sm px-2 max-w-[200px] truncate">
            {currentPreset}
          </span>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigatePreset("next")}
            className="h-8 w-8"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <GridIcon className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="p-6 max-w-none w-auto">
            <div className="flex flex-col gap-6">
              <PresetGrid
                audioState={audioState}
                startIndex={gridStartIndex}
                onPresetSelect={(preset) => {
                  loadPreset(preset);
                  const closeButton = document.querySelector<HTMLButtonElement>(
                    '[data-slot="dialog-close"]'
                  );
                  closeButton?.click();
                }}
              />
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateGrid("prev")}
                >
                  <ChevronLeftIcon className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateGrid("next")}
                >
                  Next
                  <ChevronRightIcon className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? (
            <Minimize2Icon className="h-4 w-4" />
          ) : (
            <Maximize2Icon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};
