import { TableVirtualizer } from "../components/TableVirtualizer";
import { CoverFlow } from "../components/CoverFlow";

function App() {
  // Sample data for TableVirtualizer
  const tableItems = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    name: `Item ${i + 1}`,
    description: `This is item number ${i + 1} in the virtualized list`,
  }));

  // Sample data for CoverFlow
  const coverFlowItems = Array.from({ length: 100 }, (_, i) => ({
    id: `${i + 1}`,
    title: `Item ${i + 1}`,
    imgSrc:
      i % 2 === 0
        ? "https://i.scdn.co/image/ab67616d00001e02d9194aa18fa4c9362b47464f"
        : null,
  }));

  return (
    <div className="h-screen flex flex-col">
      {/* CoverFlow on top */}
      <div className="flex-none" style={{ height: "40vh" }}>
        <CoverFlow items={coverFlowItems} />
      </div>

      {/* TableVirtualizer below */}
      <div className="flex-1 min-h-0">
        <TableVirtualizer
          items={tableItems}
          itemHeight={60}
          overscan={5}
          renderItem={(item, index) => (
            <div
              className="border-b border-gray-200 dark:border-gray-800 p-4 hover:opacity-60 transition-opacity font-mono text-sm"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <div className="text-gray-500 dark:text-gray-400 w-12">
                #{item.id}
              </div>
              <div className="flex-1">
                <div className="text-black dark:text-white font-medium">
                  {item.name}
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-xs">
                  {item.description}
                </div>
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}

export default App;
