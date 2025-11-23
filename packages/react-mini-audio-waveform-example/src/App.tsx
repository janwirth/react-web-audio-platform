import { useEffect, useState, useCallback, useMemo } from "react";
import { AudioItem } from "./components/AudioItem";
import { GlobalControls } from "./components/GlobalControls";
import { AudioContextProvider } from "@janwirth/react-web-audio-context";
import { dequeueAudioBufferRequest } from "@janwirth/react-web-audio-context";
import type { ColorPalette } from "@janwirth/react-mini-audio-waveform";
import { Player } from "./components/Player";
import { PlayerUI } from "./components/PlayerUI";
import { Visualizer } from "./components/Visualizer";
import { Responsive, WidthProvider } from "react-grid-layout";
import type { Layout, Layouts } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

interface AudioItemData {
  title: string;
  audioUrl: string;
}

const API_URL = "http://localhost:3001/api/audio-items";
const BASE_URL = "http://localhost:3001";

const ResponsiveGridLayout = WidthProvider(Responsive);

function App() {
  const [audioItems, setAudioItems] = useState<AudioItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Global control values
  const [customPalette, setCustomPalette] = useState<Partial<ColorPalette>>({});
  const [waveformHeight, setWaveformHeight] = useState(32);

  // Re-render key to force reload
  const [reRenderKey, setReRenderKey] = useState(0);

  // Grid layout state
  const [layouts, setLayouts] = useState<Layouts>({});

  const handleReRender = useCallback(() => {
    // Clear cache for all audio items
    audioItems.forEach((item) => {
      const fullAudioUrl = `${BASE_URL}${item.audioUrl}`;
      const audioUrlWithKey =
        reRenderKey > 0
          ? `${fullAudioUrl}?reload=${reRenderKey}`
          : fullAudioUrl;
      dequeueAudioBufferRequest(audioUrlWithKey);
    });
    // Increment the key to trigger a reload with a new URL
    setReRenderKey((prev) => prev + 1);
  }, [audioItems, reRenderKey]);

  useEffect(() => {
    const fetchAudioItems = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();
        setAudioItems(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      }
    };

    fetchAudioItems();
  }, []);

  // Calculate row height based on viewport height
  // All items including PlayerUI are now in the grid
  const [rowHeight, setRowHeight] = useState(() => {
    if (typeof window === "undefined") return 60;
    const availableHeight = window.innerHeight - 32; // Padding only
    const totalRows = 12; // Fixed 12 rows
    return Math.floor(availableHeight / totalRows);
  });

  useEffect(() => {
    const updateRowHeight = () => {
      const availableHeight = window.innerHeight - 32; // Padding only
      const totalRows = 12; // Fixed 12 rows
      setRowHeight(Math.floor(availableHeight / totalRows));
    };

    updateRowHeight();
    window.addEventListener("resize", updateRowHeight);
    return () => window.removeEventListener("resize", updateRowHeight);
  }, []);

  // Generate initial layout for grid items
  const generateLayout = useMemo((): Layout[] => {
    const layout: Layout[] = [];

    // PlayerUI - full width, 1 row high (resizable width, max height 1)
    layout.push({
      i: "playerUI",
      x: 0,
      y: 0,
      w: 12,
      h: 1,
      minW: 6,
      maxW: 12,
      minH: 1,
      maxH: 1,
    });

    // Visualizer - full width, 4 rows high (resizable width)
    layout.push({
      i: "visualizer",
      x: 0,
      y: 1,
      w: 12,
      h: 4,
      minW: 6,
      maxW: 12,
      minH: 3,
      maxH: 6,
    });

    // GlobalControls - full width, 1 row high (resizable width)
    layout.push({
      i: "globalControls",
      x: 0,
      y: 5,
      w: 12,
      h: 1,
      minW: 6,
      maxW: 12,
      minH: 1,
      maxH: 2,
    });

    // AudioItems - each takes full width, distribute remaining rows (resizable width)
    const remainingRows = 12 - 1 - 4 - 1; // Total rows - playerUI - visualizer - controls
    const rowsPerItem = Math.max(
      1,
      Math.floor(remainingRows / Math.max(audioItems.length, 1))
    );

    audioItems.forEach((_item, index) => {
      layout.push({
        i: `audioItem-${index}`,
        x: 0,
        y: 6 + index * rowsPerItem,
        w: 12,
        h: rowsPerItem,
        minW: 4,
        maxW: 12,
        minH: 1,
      });
    });

    return layout;
  }, [audioItems]);

  // Initialize layouts on mount and when audioItems change
  useEffect(() => {
    if (audioItems.length > 0) {
      setLayouts({
        lg: generateLayout,
        md: generateLayout,
        sm: generateLayout,
        xs: generateLayout,
        xxs: generateLayout,
      });
    }
  }, [generateLayout, audioItems.length]);

  const handleLayoutChange = useCallback(
    (_layout: Layout[], allLayouts: Layouts) => {
      setLayouts(allLayouts);
    },
    []
  );

  if (loading) {
    return (
      <AudioContextProvider>
        <Player>
          <div className="p-4">Loading...</div>
        </Player>
      </AudioContextProvider>
    );
  }

  if (error) {
    return (
      <AudioContextProvider>
        <Player>
          <div className="p-4 text-red-600">Error: {error}</div>
        </Player>
      </AudioContextProvider>
    );
  }

  return (
    <AudioContextProvider>
      <Player>
        <div className="relative h-screen w-screen overflow-hidden">
          <div className="h-full w-full">
            <ResponsiveGridLayout
              className="layout"
              layouts={layouts}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 }}
              rowHeight={rowHeight}
              onLayoutChange={handleLayoutChange}
              margin={[8, 8]}
              containerPadding={[16, 16]}
              compactType={null}
              preventCollision={true}
              isDraggable={true}
              isResizable={true}
              draggableHandle=".drag-handle"
            >
              <div
                key="playerUI"
                className="h-full overflow-hidden bg-gray-100"
              >
                <div className="drag-handle w-full h-2 cursor-move bg-gray-300 hover:bg-gray-400 opacity-0 hover:opacity-100 transition-opacity"></div>
                <PlayerUI />
              </div>
              <div key="visualizer" className="h-full overflow-hidden">
                <div className="drag-handle w-full h-2 cursor-move bg-gray-300 hover:bg-gray-400 opacity-0 hover:opacity-100 transition-opacity"></div>
                <Visualizer />
              </div>
              <div key="globalControls" className="h-full overflow-hidden">
                <div className="drag-handle w-full h-2 cursor-move bg-gray-300 hover:bg-gray-400 opacity-0 hover:opacity-100 transition-opacity"></div>
                <GlobalControls
                  onPaletteChange={setCustomPalette}
                  onHeightChange={setWaveformHeight}
                  onReRender={handleReRender}
                />
              </div>
              {audioItems.map((item, index) => (
                <div
                  key={`audioItem-${index}`}
                  className="h-full overflow-auto"
                >
                  <div className="drag-handle w-full h-2 cursor-move bg-gray-300 hover:bg-gray-400 opacity-0 hover:opacity-100 transition-opacity"></div>
                  <AudioItem
                    title={item.title}
                    audioUrl={item.audioUrl}
                    baseUrl={BASE_URL}
                    customPalette={customPalette}
                    waveformHeight={waveformHeight}
                    reRenderKey={reRenderKey}
                  />
                </div>
              ))}
            </ResponsiveGridLayout>
          </div>
        </div>
      </Player>
    </AudioContextProvider>
  );
}

export default App;
