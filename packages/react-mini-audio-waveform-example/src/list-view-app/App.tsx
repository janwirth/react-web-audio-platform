import { useRef } from "react";
import {
  TableVirtualizer,
  TableVirtualizerHandle,
} from "../components/TableVirtualizer";
import { CoverFlow } from "../components/CoverFlow";

// Shared dummy data for both CoverFlow and TableVirtualizer
const sharedItems = Array.from({ length: 350 }, (_, i) => ({
  id: i + 1,
  title: `Item ${i + 1}`,
  name: `Item ${i + 1}`,
  description: `This is item number ${i + 1} in the virtualized list`,
  imgSrc:
    i % 2 === 0
      ? "https://i.scdn.co/image/ab67616d00001e02d9194aa18fa4c9362b47464f"
      : null,
}));

function App() {
  const tableVirtualizerRef = useRef<TableVirtualizerHandle>(null);

  // Transform shared data for TableVirtualizer
  const tableItems = sharedItems.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    imgSrc: item.imgSrc,
  }));

  // Transform shared data for CoverFlow
  const coverFlowItems = sharedItems.map((item) => ({
    id: `${item.id}`,
    title: item.title,
    imgSrc: item.imgSrc,
  }));

  const handleFocussedItem = (_item: any, index: number) => {
    tableVirtualizerRef.current?.scrollToIndex(index);
  };

  return (
    <div className="h-screen flex flex-col gap-4 p-4 ">
      {/* CoverFlow on top */}
      <CoverFlow items={coverFlowItems} onFocussedItem={handleFocussedItem} />

      {/* TableVirtualizer below */}
      <div className="flex-1 min-h-0">
        <TableVirtualizer
          ref={tableVirtualizerRef}
          items={tableItems}
          itemHeight={60}
          overscan={5}
          renderItem={(item) => (
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
              {item.imgSrc && (
                <div className="w-12 h-12 shrink-0">
                  <img
                    src={item.imgSrc}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {!item.imgSrc && (
                <div className="w-12 h-12 shrink-0 bg-gray-400 dark:bg-gray-600 border border-gray-800 dark:border-gray-400" />
              )}
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
