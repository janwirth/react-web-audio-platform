import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useAtom } from "jotai";
import { Column } from "@/components/Column";
import { Row } from "@/components/Row";
import {
  TableVirtualizer as TableVirtualizerComponent,
  TableVirtualizerHandle,
} from "@/components/TableVirtualizer";
import { debugViewAtom } from "@/atoms/debugView";
import { FPSMeter } from "@overengineering/fps-meter";

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

type SortField = "title" | "category" | "status" | null;
type SortDirection = "asc" | "desc";

function TableVirtualizer() {
  const [, setDebugView] = useAtom(debugViewAtom);

  // Enable debug view for TableVirtualizer
  useEffect(() => {
    setDebugView(true);
  }, [setDebugView]);

  return (
    <Column className="h-full w-full" style={{ height: "100vh" }}>
      <FPSMeter />
      <Row className="flex-1" style={{ minHeight: 0 }}>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
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
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <TableVirtualizerComponent
              items={exampleItems}
              itemHeight={100}
              overscan={5}
              renderItem={(item, index) => (
                <div
                  style={{
                    padding: "12px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    height: "100%",
                    justifyContent: "center",
                    boxSizing: "border-box",
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

const meta = {
  title: "Stories/TableVirtualizer",
  component: TableVirtualizer,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TableVirtualizer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithHeader: Story = {
  render: TableWithHeader,
};

export const WithSorting: Story = {
  render: TableWithSorting,
};

export const WithCursor: Story = {
  render: TableWithCursor,
};

export const AllFeatures: Story = {
  render: TableWithAllFeatures,
};

// Story with table header
function TableWithHeader() {
  const [, setDebugView] = useAtom(debugViewAtom);

  useEffect(() => {
    setDebugView(true);
  }, [setDebugView]);

  const headerHeight = 40;

  return (
    <Column className="h-full w-full" style={{ height: "100vh" }}>
      <FPSMeter />
      <Row className="flex-1" style={{ minHeight: 0 }}>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
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
            TableVirtualizer with Header
          </div>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Table Header */}
            <div
              className="flex items-center px-4 border-b border-gray-300/30 font-mono text-xs font-bold"
              style={{
                height: headerHeight,
              }}
            >
              <div style={{ flex: "0 0 60px" }}>ID</div>
              <div style={{ flex: 1 }}>Title</div>
              <div style={{ flex: 1 }}>Description</div>
              <div style={{ flex: "0 0 120px" }}>Category</div>
              <div style={{ flex: "0 0 100px" }}>Status</div>
            </div>
            {/* Table Content */}
            <Column style={{ flex: 1, minHeight: 0 }}>
              <TableVirtualizerComponent
                items={exampleItems}
                itemHeight={60}
                overscan={5}
                renderItem={(item, index) => (
                  <div
                    style={{
                      padding: "0 16px",
                      display: "flex",
                      alignItems: "center",
                      height: "100%",
                      boxSizing: "border-box",
                      fontFamily: "monospace",
                      fontSize: "12px",
                      borderBottom: "1px solid rgba(128, 128, 128, 0.1)",
                    }}
                  >
                    <div style={{ flex: "0 0 60px" }}>#{item.id}</div>
                    <div
                      style={{
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: "#666",
                      }}
                    >
                      {item.description}
                    </div>
                    <div style={{ flex: "0 0 120px" }}>{item.category}</div>
                    <div style={{ flex: "0 0 100px" }}>
                      <span
                        style={{
                          fontSize: "11px",
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
                      </span>
                    </div>
                  </div>
                )}
                className="flex-1"
              />
            </Column>
          </div>
        </Column>
      </Row>
    </Column>
  );
}

// Story with sorting
function TableWithSorting() {
  const [, setDebugView] = useAtom(debugViewAtom);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  useEffect(() => {
    setDebugView(true);
  }, [setDebugView]);

  const sortedItems = useMemo(() => {
    if (!sortField) return exampleItems;

    return [...exampleItems].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [sortField, sortDirection]);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      } else {
        setSortField(field);
        setSortDirection("asc");
      }
    },
    [sortField, sortDirection]
  );

  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) return "";
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  return (
    <Column className="h-full w-full" style={{ height: "100vh" }}>
      <FPSMeter />
      <Row className="flex-1" style={{ minHeight: 0 }}>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
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
            TableVirtualizer with Sorting
          </div>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Sortable Header */}
            <div className="flex items-center px-4 border-b border-gray-300/30 font-mono text-xs font-bold h-10">
              <div
                style={{
                  flex: "0 0 60px",
                  cursor: "pointer",
                  userSelect: "none",
                }}
                onClick={() => handleSort(null)}
              >
                ID{getSortIndicator(null)}
              </div>
              <div
                style={{
                  flex: 1,
                  cursor: "pointer",
                  userSelect: "none",
                }}
                onClick={() => handleSort("title")}
              >
                Title{getSortIndicator("title")}
              </div>
              <div
                style={{
                  flex: "0 0 120px",
                  cursor: "pointer",
                  userSelect: "none",
                }}
                onClick={() => handleSort("category")}
              >
                Category{getSortIndicator("category")}
              </div>
              <div
                style={{
                  flex: "0 0 100px",
                  cursor: "pointer",
                  userSelect: "none",
                }}
                onClick={() => handleSort("status")}
              >
                Status{getSortIndicator("status")}
              </div>
            </div>
            {/* Table Content */}
            <Column style={{ flex: 1, minHeight: 0 }}>
              <TableVirtualizerComponent
                items={sortedItems}
                itemHeight={60}
                overscan={5}
                renderItem={(item, index) => (
                  <div
                    style={{
                      padding: "0 16px",
                      display: "flex",
                      alignItems: "center",
                      height: "100%",
                      boxSizing: "border-box",
                      fontFamily: "monospace",
                      fontSize: "12px",
                      borderBottom: "1px solid rgba(128, 128, 128, 0.1)",
                    }}
                  >
                    <div style={{ flex: "0 0 60px" }}>#{item.id}</div>
                    <div
                      style={{
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.title}
                    </div>
                    <div style={{ flex: "0 0 120px" }}>{item.category}</div>
                    <div style={{ flex: "0 0 100px" }}>
                      <span
                        style={{
                          fontSize: "11px",
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
                      </span>
                    </div>
                  </div>
                )}
                className="flex-1"
              />
            </Column>
          </div>
        </Column>
      </Row>
    </Column>
  );
}

// Story with cursor/keyboard navigation
function TableWithCursor() {
  const [, setDebugView] = useAtom(debugViewAtom);
  const [cursorIndex, setCursorIndex] = useState(0);
  const virtualizerRef = useRef<TableVirtualizerHandle>(null);

  useEffect(() => {
    setDebugView(true);
  }, [setDebugView]);

  const moveUp = useCallback(() => {
    setCursorIndex((prev) => {
      const newIndex = Math.max(0, prev - 1);
      setTimeout(() => {
        virtualizerRef.current?.scrollToIndexIfNeeded(newIndex);
      }, 0);
      return newIndex;
    });
  }, []);

  const moveDown = useCallback(() => {
    setCursorIndex((prev) => {
      const newIndex = Math.min(exampleItems.length - 1, prev + 1);
      setTimeout(() => {
        virtualizerRef.current?.scrollToIndexIfNeeded(newIndex);
      }, 0);
      return newIndex;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        moveUp();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        moveDown();
      } else if (e.key === "Home") {
        e.preventDefault();
        setCursorIndex(0);
        setTimeout(() => {
          virtualizerRef.current?.scrollToIndex(0);
        }, 0);
      } else if (e.key === "End") {
        e.preventDefault();
        const lastIndex = exampleItems.length - 1;
        setCursorIndex(lastIndex);
        setTimeout(() => {
          virtualizerRef.current?.scrollToIndex(lastIndex);
        }, 0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moveUp, moveDown]);

  return (
    <Column className="h-full w-full" style={{ height: "100vh" }}>
      <FPSMeter />
      <Row className="flex-1" style={{ minHeight: 0 }}>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
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
            TableVirtualizer with Cursor (Use Arrow Keys)
          </div>
          <div
            style={{
              marginBottom: "10px",
              fontSize: "12px",
              fontFamily: "monospace",
              color: "#666",
            }}
          >
            Cursor: {cursorIndex + 1} / {exampleItems.length}
          </div>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <TableVirtualizerComponent
              ref={virtualizerRef}
              items={exampleItems}
              itemHeight={100}
              overscan={5}
              renderItem={(item, index) => {
                const isSelected = index === cursorIndex;
                return (
                  <div
                    className={`flex flex-col gap-1.5 h-full justify-center box-border ${
                      isSelected
                        ? "border-l-current border-l-3 border-[ridge]"
                        : ""
                    }`}
                    style={{
                      padding: "12px 16px",
                    }}
                  >
                    {/* {isSelected && (
                      <div
                        style={{
                          fontSize: "10px",
                          fontFamily: "monospace",
                          color: "#666",
                          marginBottom: "4px",
                        }}
                      >
                        ← Selected
                      </div>
                    )} */}
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
                );
              }}
              className="flex-1"
            />
          </div>
        </Column>
      </Row>
    </Column>
  );
}

// Combined story with all features
function TableWithAllFeatures() {
  const [, setDebugView] = useAtom(debugViewAtom);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [cursorIndex, setCursorIndex] = useState(0);
  const virtualizerRef = useRef<TableVirtualizerHandle>(null);

  useEffect(() => {
    setDebugView(true);
  }, [setDebugView]);

  const sortedItems = useMemo(() => {
    if (!sortField) return exampleItems;

    return [...exampleItems].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [sortField, sortDirection]);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      } else {
        setSortField(field);
        setSortDirection("asc");
      }
      setCursorIndex(0);
    },
    [sortField, sortDirection]
  );

  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) return "";
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  const moveUp = useCallback(() => {
    setCursorIndex((prev) => {
      const newIndex = Math.max(0, prev - 1);
      setTimeout(() => {
        virtualizerRef.current?.scrollToIndexIfNeeded(newIndex);
      }, 0);
      return newIndex;
    });
  }, []);

  const moveDown = useCallback(() => {
    setCursorIndex((prev) => {
      const newIndex = Math.min(sortedItems.length - 1, prev + 1);
      setTimeout(() => {
        virtualizerRef.current?.scrollToIndexIfNeeded(newIndex);
      }, 0);
      return newIndex;
    });
  }, [sortedItems.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        moveUp();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        moveDown();
      } else if (e.key === "Home") {
        e.preventDefault();
        setCursorIndex(0);
        setTimeout(() => {
          virtualizerRef.current?.scrollToIndex(0);
        }, 0);
      } else if (e.key === "End") {
        e.preventDefault();
        const lastIndex = sortedItems.length - 1;
        setCursorIndex(lastIndex);
        setTimeout(() => {
          virtualizerRef.current?.scrollToIndex(lastIndex);
        }, 0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moveUp, moveDown, sortedItems.length]);

  const itemHeight = 60;

  return (
    <Column className="h-full w-full" style={{ height: "100vh" }}>
      <FPSMeter />
      <Row className="flex-1" style={{ minHeight: 0 }}>
        {/* Main Content */}
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
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
            TableVirtualizer - All Features Combined
          </div>
          <div
            style={{
              marginBottom: "10px",
              fontSize: "12px",
              fontFamily: "monospace",
              color: "#666",
            }}
          >
            Cursor: {cursorIndex + 1} / {sortedItems.length} | Use Arrow Keys
          </div>
          <Column
            style={{
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            {/* Sortable Header */}
            <div className="flex items-center px-4 border-b border-gray-300/30 font-mono text-xs font-bold h-10 shrink-0">
              <div
                style={{
                  flex: "0 0 60px",
                  cursor: "pointer",
                  userSelect: "none",
                }}
                onClick={() => handleSort(null)}
              >
                ID{getSortIndicator(null)}
              </div>
              <div
                style={{
                  flex: 1,
                  cursor: "pointer",
                  userSelect: "none",
                }}
                onClick={() => handleSort("title")}
              >
                Title{getSortIndicator("title")}
              </div>
              <div
                style={{
                  flex: "0 0 120px",
                  cursor: "pointer",
                  userSelect: "none",
                }}
                onClick={() => handleSort("category")}
              >
                Category{getSortIndicator("category")}
              </div>
              <div
                style={{
                  flex: "0 0 100px",
                  cursor: "pointer",
                  userSelect: "none",
                }}
                onClick={() => handleSort("status")}
              >
                Status{getSortIndicator("status")}
              </div>
            </div>
            {/* Table Content */}
            <Column style={{ flex: 1, minHeight: 0 }}>
              <TableVirtualizerComponent
                ref={virtualizerRef}
                items={sortedItems}
                itemHeight={itemHeight}
                overscan={5}
                renderItem={(item, index) => {
                  const isSelected = index === cursorIndex;

                  return (
                    <div
                      className={`px-4 flex items-center h-full box-border font-mono text-xs border-b border-gray-300/10 ${
                        isSelected ? "border-l-[3px] border-l-current" : ""
                      }`}
                    >
                      <div style={{ flex: "0 0 60px" }}>#{item.id}</div>
                      <div
                        style={{
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.title}
                      </div>
                      <div style={{ flex: "0 0 120px" }}>{item.category}</div>
                      <div style={{ flex: "0 0 100px" }}>
                        <span
                          style={{
                            fontSize: "11px",
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
                        </span>
                      </div>
                    </div>
                  );
                }}
                className="flex-1"
              />
            </Column>
          </Column>
        </Column>
      </Row>
    </Column>
  );
}
