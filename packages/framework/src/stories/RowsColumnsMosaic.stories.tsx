import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState, useMemo } from 'react';
import { useAtom } from 'jotai';
import { Row } from '@/components/Row';
import { Column } from '@/components/Column';
import { TableVirtualizer } from '@/components/TableVirtualizer';
import { debugViewAtom } from '@/atoms/debugView';
import { Player } from '@/components/player/Player';
import { PlayerUI } from '@/components/player/PlayerUI';
import { Visualizer } from '@/components/visualizer/Visualizer';
import { ColorPicker } from '@/components/inputs/ColorPicker';
import { generateOklchPalette } from '@/components/waveform';
import type { ColorPalette } from '@/components/waveform';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AudioContextProvider } from '@/components/audio-context';

// Example text content
const shortText = 'This is a short content cell that fits nicely.';
const mediumText =
  'This cell has medium length content that might wrap but shouldn\'t overflow too much. It demonstrates how content behaves in a constrained space.';
const longText1 =
  'This cell contains a very long text that will overflow and demonstrate scrolling behavior. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.';
const longText2 =
  'This is another cell with extremely long content that will definitely overflow. It contains multiple paragraphs and lots of text to test scrolling and overflow handling. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. At vero eos et accusam aliquyam diam diam dolore dolores duo eirmod eos erat, et nonumy sed tempor et et invidunt justo labore Stet clita ea et gubergren, kasd magna no rebum. Sanctus sea sed takimata ut vero voluptua. Est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat. Consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr.';
const longText3 =
  'More long content to demonstrate overflow. This text keeps going and going, testing how the layout handles content that exceeds the available space. It should scroll within its cell container. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus imperdiet, nulla et dictum interdum, nisi lorem egestas odio, vitae scelerisque enim ligula venenatis dolor. Maecenas nisl est, ultrices nec congue eget, auctor vitae massa. Fusce luctus vestibulum augue ut aliquet. Mauris ante ligula, facilisis sed ornare eu, lobortis in odio. Praesent convallis urna a lacus interdum ut hendrerit risus congue. Nunc sagittis dictum nisi, sed ullamcorper ipsum dignissim ac. In at libero sed nunc venenatis imperdiet sed ornare turpis. Donec vitae dui eget tellus gravida venenatis. Integer fringilla congue eros non fermentum. Sed dapibus pulvinar nibh tempor porta. Cras ac leo purus. Mauris quis diam velit.';
const longText4 =
  'Yet another cell with extensive content. This demonstrates how different cells handle overflow independently. Each cell can scroll on its own while maintaining the overall grid structure. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';

// Example items for TableVirtualizer
const exampleItems = Array.from({ length: 100 }, (_, i) => ({
  id: i,
  title: `Item ${i + 1}`,
  description: `This is item number ${
    i + 1
  } in the virtualized list. It contains some example content to demonstrate the TableVirtualizer component with debug view enabled.`,
  category: `Category ${Math.floor(i / 10) + 1}`,
  status: i % 3 === 0 ? "active" : i % 3 === 1 ? "pending" : "completed",
}));

// Default values for OKLCH color picker
const DEFAULT_HUE = 240;
const DEFAULT_SATURATION = 0.2;
const DEFAULT_HUE_SPREAD = 60;
const DEFAULT_CONTRAST = 0;
const DEFAULT_LIGHTNESS = 0.5;

function RowsColumnsMosaic() {
  const [, setDebugView] = useAtom(debugViewAtom);

  // Enable debug view for TableVirtualizer
  useEffect(() => {
    setDebugView(true);
  }, [setDebugView]);

  return (
    <Column className="h-full w-full" style={{ height: '100vh' }}>
      {/* First Row */}
      <Row className="flex-1" style={{ minHeight: 0 }}>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
            padding: '10px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              padding: '8px',
              overflow: 'auto',
            }}
          >
            <div
              style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}
            >
              Cell 1 - Short
            </div>
            <div style={{ fontSize: '14px' }}>{shortText}</div>
          </div>
        </Column>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
            padding: '10px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              padding: '8px',
              overflow: 'auto',
            }}
          >
            <div
              style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}
            >
              Cell 2 - Long Overflow
            </div>
            <div
              style={{
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                fontSize: '12px',
                lineHeight: '1.4',
              }}
            >
              {longText1}
            </div>
          </div>
        </Column>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
            padding: '10px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              padding: '8px',
              overflow: 'auto',
            }}
          >
            <div
              style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}
            >
              Cell 3 - Medium
            </div>
            <div style={{ fontSize: '14px' }}>{mediumText}</div>
          </div>
        </Column>
      </Row>

      {/* Second Row */}
      <Row className="flex-1" style={{ minHeight: 0 }}>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
            padding: '10px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              padding: '8px',
              overflow: 'auto',
            }}
          >
            <div
              style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}
            >
              Cell 4 - Very Long
            </div>
            <div
              style={{
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                fontSize: '12px',
                lineHeight: '1.4',
              }}
            >
              {longText2}
            </div>
          </div>
        </Column>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
            padding: '10px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              padding: '8px',
              overflow: 'auto',
            }}
          >
            <div
              style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}
            >
              Cell 5 - Short
            </div>
            <div style={{ fontSize: '14px' }}>Brief content here.</div>
          </div>
        </Column>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
            padding: '10px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              padding: '8px',
              overflow: 'auto',
            }}
          >
            <div
              style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}
            >
              Cell 6 - Overflowing
            </div>
            <div
              style={{
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                fontSize: '12px',
                lineHeight: '1.4',
              }}
            >
              {longText3}
            </div>
          </div>
        </Column>
      </Row>

      {/* Third Row */}
      <Row className="flex-1" style={{ minHeight: 0 }}>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
            padding: '10px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              padding: '8px',
              overflow: 'auto',
            }}
          >
            <div
              style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}
            >
              Cell 7 - Normal
            </div>
            <div style={{ fontSize: '14px' }}>
              Standard content that fits well.
            </div>
          </div>
        </Column>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
            padding: '10px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              padding: '8px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}
            >
              Cell 8 - TableVirtualizer
            </div>
            <TableVirtualizer
              items={exampleItems}
              itemHeight={60}
              overscan={3}
              renderItem={(item, index) => (
                <div
                  style={{
                    padding: '8px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 'bold',
                      fontSize: '14px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#666',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: '1.4',
                    }}
                  >
                    {item.description}
                  </div>
                </div>
              )}
              className="flex-1"
            />
          </div>
        </Column>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
            padding: '10px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              padding: '8px',
              overflow: 'auto',
            }}
          >
            <div
              style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}
            >
              Cell 9 - Compact
            </div>
            <div style={{ fontSize: '14px' }}>Small content.</div>
          </div>
        </Column>
      </Row>
    </Column>
  );
}

// Enhanced version with Player, Visualizer, and ColorPicker
function RowsColumnsMosaicContent() {
  const [, setDebugView] = useAtom(debugViewAtom);
  const { isDark } = useColorScheme();

  // Enable debug view for TableVirtualizer
  useEffect(() => {
    setDebugView(true);
  }, [setDebugView]);

  // OKLCH color picker state
  const [hue, setHue] = useState(DEFAULT_HUE);
  const [saturation, setSaturation] = useState(DEFAULT_SATURATION);
  const [hueSpread, setHueSpread] = useState(DEFAULT_HUE_SPREAD);
  const [contrast, setContrast] = useState(DEFAULT_CONTRAST);
  const [lightness, setLightness] = useState(DEFAULT_LIGHTNESS);

  // Generate custom OKLCH palette
  const colorPalette = useMemo<ColorPalette>(
    () =>
      generateOklchPalette(
        hue,
        saturation,
        hueSpread,
        isDark ? -contrast : contrast,
        lightness
      ),
    [hue, saturation, hueSpread, contrast, lightness, isDark]
  );

  // Extract text color from palette
  const textColor = colorPalette.lowFrequency;

  return (
    <Column className="h-full w-full" style={{ height: "100%" }}>
      {/* First Row */}
      <Row className="flex-1" style={{ minHeight: 0 }}>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
            padding: "10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              padding: "8px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                marginBottom: "8px",
                color: textColor,
              }}
            >
              Player Controls
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
              <PlayerUI />
            </div>
          </div>
        </Column>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
            padding: "10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              padding: "8px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                marginBottom: "8px",
                color: textColor,
              }}
            >
              Visualizer
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <Visualizer />
            </div>
          </div>
        </Column>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
            padding: "10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              padding: "8px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                marginBottom: "8px",
                color: textColor,
              }}
            >
              OKLCH Color Picker
            </div>
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ColorPicker
                hue={hue}
                saturation={saturation}
                hueSpread={hueSpread}
                contrast={contrast}
                lightness={lightness}
                onHueChange={setHue}
                onSaturationChange={setSaturation}
                onHueSpreadChange={setHueSpread}
                onContrastChange={setContrast}
                onLightnessChange={setLightness}
              />
            </div>
            <div
              style={{
                marginTop: "8px",
                fontSize: "12px",
                color: textColor,
                opacity: 0.7,
              }}
            >
              Color: {colorPalette.lowFrequency}
            </div>
          </div>
        </Column>
      </Row>

      {/* Second Row */}
      <Row className="flex-1" style={{ minHeight: 0 }}>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
            padding: "10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              padding: "8px",
              overflow: "auto",
            }}
          >
            <div
              style={{ fontWeight: "bold", marginBottom: "8px", color: "#333" }}
            >
              Cell 4 - Very Long
            </div>
            <div
              style={{
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                fontSize: "12px",
                lineHeight: "1.4",
              }}
            >
              {longText2}
            </div>
          </div>
        </Column>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
            padding: "10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              padding: "8px",
              overflow: "auto",
            }}
          >
            <div
              style={{ fontWeight: "bold", marginBottom: "8px", color: "#333" }}
            >
              Cell 5 - Short
            </div>
            <div style={{ fontSize: "14px" }}>Brief content here.</div>
          </div>
        </Column>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
            padding: "10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              padding: "8px",
              overflow: "auto",
            }}
          >
            <div
              style={{ fontWeight: "bold", marginBottom: "8px", color: "#333" }}
            >
              Cell 6 - Overflowing
            </div>
            <div
              style={{
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                fontSize: "12px",
                lineHeight: "1.4",
              }}
            >
              {longText3}
            </div>
          </div>
        </Column>
      </Row>

      {/* Third Row */}
      <Row className="flex-1" style={{ minHeight: 0 }}>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
            padding: "10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              padding: "8px",
              overflow: "auto",
            }}
          >
            <div
              style={{ fontWeight: "bold", marginBottom: "8px", color: "#333" }}
            >
              Cell 7 - Normal
            </div>
            <div style={{ fontSize: "14px" }}>
              Standard content that fits well.
            </div>
          </div>
        </Column>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
            padding: "10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              padding: "8px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                marginBottom: "8px",
                color: textColor,
              }}
            >
              Playlist (TableVirtualizer)
            </div>
            <TableVirtualizer
              items={exampleItems}
              itemHeight={80}
              overscan={5}
              renderItem={(item) => (
                <div
                  style={{
                    padding: "12px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    height: "100%",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "14px",
                        fontFamily: "monospace",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                        color: textColor,
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontFamily: "monospace",
                        padding: "2px 8px",
                        color:
                          item.status === "active"
                            ? "#1976d2"
                            : item.status === "pending"
                            ? "#f57c00"
                            : "#388e3c",
                      }}
                    >
                      {item.status}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      fontFamily: "monospace",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      lineHeight: "1.4",
                    }}
                  >
                    {item.description}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#999",
                      fontFamily: "monospace",
                    }}
                  >
                    {item.category}
                  </div>
                </div>
              )}
              className="flex-1"
            />
          </div>
        </Column>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
            padding: "10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              padding: "8px",
              overflow: "auto",
            }}
          >
            <div
              style={{ fontWeight: "bold", marginBottom: "8px", color: "#333" }}
            >
              Cell 9 - Compact
            </div>
            <div style={{ fontSize: "14px" }}>Small content.</div>
          </div>
        </Column>
      </Row>
    </Column>
  );
}

function RowsColumnsMosaicWithPlayer() {
  return (
    <AudioContextProvider>
      <Player>
        <RowsColumnsMosaicContent />
      </Player>
    </AudioContextProvider>
  );
}

const meta = {
  title: "Stories/RowsColumnsMosaic",
  component: RowsColumnsMosaic,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof RowsColumnsMosaic>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithPlayer: Story = {
  render: RowsColumnsMosaicWithPlayer,
};

