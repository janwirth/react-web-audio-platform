import { useState } from "react";
import { Row } from "./Row";
import { Column } from "./Column";
import { IframeScaler } from "./IframeScaler";

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
];

function App() {
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(
    fixtures[0] || null
  );

  return (
    <Row className="h-full w-full" style={{ height: "100%" }}>
      {/* Left sidebar with fixture list */}
      <Column className="w-64 overflow-y-auto">
        <div className="font-mono text-sm font-bold">Fixtures</div>
        {fixtures.map((fixture) => (
          <button
            key={fixture.id}
            onClick={() => setSelectedFixture(fixture)}
            className={`
              font-mono text-sm
              hover:opacity-60 transition-opacity
              text-left
              ${
                selectedFixture?.id === fixture.id
                  ? "bg-black dark:bg-white"
                  : ""
              }
            `}
          >
            <div
              className={`font-bold ${
                selectedFixture?.id === fixture.id
                  ? "text-white dark:text-black"
                  : ""
              }`}
            >
              {fixture.name}
            </div>
            <IframeScaler
              src={fixture.src}
              targetWidth={200}
              targetHeight={150}
              iframeWidth={1920}
              iframeHeight={1080}
            />
          </button>
        ))}
      </Column>

      {/* Right side with selected fixture */}
      <Column className="flex-1" style={{ minWidth: 0, minHeight: 0 }}>
        {selectedFixture ? (
          <iframe
            src={selectedFixture.src}
            className="w-full h-full border-none"
            style={{ display: "block" }}
          />
        ) : null}
      </Column>
    </Row>
  );
}

export default App;
