import { useState } from "react";
import { Row } from "@/components/Row";
import { Column } from "@/components/Column";
import { IframeScaler } from "./IframeScaler";
import { DarkModeToggle } from "@/components/DarkModeToggle";

interface Fixture {
  id: string;
  name: string;
  src: string;
}

const fixtures: Fixture[] = [
  {
    id: "story1",
    name: "Story 1",
    src: "/fixture-viewer/stories/story1.html",
  },
  {
    id: "story2",
    name: "Story 2",
    src: "/fixture-viewer/stories/story2.html",
  },
  {
    id: "rows-columns-mosaic",
    name: "Rows/Columns Mosaic",
    src: "/fixture-viewer/stories/rows-columns-mosaic.html",
  },
  {
    id: "table-virtualizer",
    name: "TableVirtualizer",
    src: "/fixture-viewer/stories/table-virtualizer.html",
  },
  {
    id: "waveform-rendering",
    name: "Waveform Rendering",
    src: "/fixture-viewer/stories/waveform-rendering.html",
  },
];

function App() {
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(
    fixtures[0] || null
  );

  return (
    <Column className=" h-screen">
      <Row className="h-full w-full" style={{ height: "100%" }}>
        {/* Left sidebar with fixture list */}
        <Column className="max-w-64 w-64 overflow-y-auto gap-4 p-4">
          {fixtures.map((fixture) => (
            <button
              key={fixture.id}
              onClick={() => setSelectedFixture(fixture)}
              className="font-mono text-sm hover:opacity-60 transition-opacity text-left"
            >
              <Column className="gap-2">
                <div className="font-bold">{fixture.name}</div>
                <IframeScaler
                  src={fixture.src}
                  targetWidth={200}
                  targetHeight={150}
                  zoom={0.2}
                />
              </Column>
            </button>
          ))}
        </Column>

        {/* Right side with selected fixture */}
        <Column className="p-8" style={{ minWidth: 0, minHeight: 0 }}>
          {selectedFixture ? (
            <div
              style={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
                border: "1px solid blue",
                borderRadius: "8px",
              }}
            >
              <iframe
                src={selectedFixture.src}
                className="w-full h-full border-none"
                style={{
                  display: "block",
                  border: "none",
                  outline: "none",
                  background: "white",
                }}
              />
            </div>
          ) : null}
        </Column>
      </Row>
      <DarkModeToggle />
    </Column>
  );
}

export default App;
