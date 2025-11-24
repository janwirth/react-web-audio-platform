import { useState } from "react";
import { Row } from "./Row";
import { Column } from "./Column";
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
    src: "/fixture-viewer/story1.html",
  },
  {
    id: "story2",
    name: "Story 2",
    src: "/fixture-viewer/story2.html",
  },
  {
    id: "story3",
    name: "Rows/Columns Mosaic",
    src: "/fixture-viewer/story3.html",
  },
  {
    id: "story4",
    name: "TableVirtualizer",
    src: "/fixture-viewer/story4.html",
  },
  {
    id: "story5",
    name: "Waveform Rendering",
    src: "/fixture-viewer/story5.html",
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
        <Column className="max-w-64 p-1 w-64 overflow-y-auto">
          <div className="font-mono text-sm font-bold">Fixtures</div>
          {fixtures.map((fixture) => (
            <button
              key={fixture.id}
              onClick={() => setSelectedFixture(fixture)}
              className="font-mono text-sm hover:opacity-60 transition-opacity text-left"
            >
              <div className="font-bold">{fixture.name}</div>
              <IframeScaler
                src={fixture.src}
                targetWidth={200}
                targetHeight={150}
                zoom={0.2}
              />
            </button>
          ))}
        </Column>

        {/* Right side with selected fixture */}
        <Column className="flex-1" style={{ minWidth: 0, minHeight: 0 }}>
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
