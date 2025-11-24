import { useEffect } from "react";
import { useAtom } from "jotai";
import { Column } from "./Column";
import { Row } from "./Row";
import { TableVirtualizer } from "../components/TableVirtualizer";
import { debugViewAtom } from "../atoms/debugView";

// Example items for TableVirtualizer
const exampleItems = Array.from({ length: 1000 }, (_, i) => ({
  id: i,
  title: `Item ${i + 1}`,
  description: `This is item number ${
    i + 1
  } in the virtualized list. It contains some example content to demonstrate the TableVirtualizer component with various features and behaviors.`,
  category: `Category ${Math.floor(i / 10) + 1}`,
  status: i % 3 === 0 ? "active" : i % 3 === 1 ? "pending" : "completed",
}));

export default function Story4() {
  const [, setDebugView] = useAtom(debugViewAtom);

  // Enable debug view for TableVirtualizer
  useEffect(() => {
    setDebugView(true);
  }, [setDebugView]);

  return (
    <Column className="h-full w-full" style={{ height: "100%" }}>
      <Row className="flex-1" style={{ minHeight: 0 }}>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
            border: "1px solid #ccc",
            padding: "20px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              marginBottom: "20px",
              fontWeight: "bold",
              fontSize: "18px",
              fontFamily: "monospace",
            }}
          >
            TableVirtualizer Demo
          </div>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              border: "1px solid #999",
              borderRadius: "4px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <TableVirtualizer
              items={exampleItems}
              itemHeight={80}
              overscan={5}
              renderItem={(item, index) => (
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #eee",
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
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontFamily: "monospace",
                        padding: "2px 8px",
                        borderRadius: "2px",
                        background:
                          item.status === "active"
                            ? "#e3f2fd"
                            : item.status === "pending"
                            ? "#fff3e0"
                            : "#e8f5e9",
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
      </Row>
    </Column>
  );
}

