import type { Meta, StoryObj } from "@storybook/react";
import { useState, useCallback, useRef, useEffect, createContext, useContext } from "react";
import { FocusIndicator } from "@/layout-and-control/FocusIndicator";

const meta = {
  title: "Stories/LayoutAndControl/KeyboardNavigation",
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Focus context for managing focus across containers
interface FocusContextValue {
  registerElement: (id: string, element: FocusableElement) => () => void;
  getElement: (id: string) => FocusableElement | undefined;
  getAllElements: () => Map<string, FocusableElement>;
  onOverscroll: (direction: "up" | "down" | "left" | "right", fromId: string) => void;
  focusedId: string | null;
  setFocusedId: (id: string | null) => void;
}

const FocusContext = createContext<FocusContextValue | null>(null);

interface FocusableElement {
  id: string;
  onUp?: () => boolean; // Returns true if handled, false if should overscroll
  onDown?: () => boolean;
  onLeft?: () => boolean;
  onRight?: () => boolean;
  getBounds: () => DOMRect;
  focus: () => void;
  blur: () => void;
}

// Hook for managing focus within a container
interface UseFocusOptions {
  onUp?: () => boolean;
  onDown?: () => boolean;
  onLeft?: () => boolean;
  onRight?: () => boolean;
  id: string;
}

function useFocus({ onUp, onDown, onLeft, onRight, id }: UseFocusOptions) {
  const context = useContext(FocusContext);
  const containerRef = useRef<HTMLDivElement>(null);
  const handlersRef = useRef({ onUp, onDown, onLeft, onRight });
  const focusRef = useRef<() => void>();
  const blurRef = useRef<() => void>();

  // Keep handlers up to date
  useEffect(() => {
    handlersRef.current = { onUp, onDown, onLeft, onRight };
  }, [onUp, onDown, onLeft, onRight]);

  const focus = useCallback(() => {
    if (context && context.focusedId !== id) {
      requestAnimationFrame(() => {
        context.setFocusedId(id);
      });
    }
  }, [context, id]);

  const blur = useCallback(() => {
    if (context && context.focusedId === id) {
      requestAnimationFrame(() => {
        context.setFocusedId(null);
      });
    }
  }, [context, id]);

  focusRef.current = focus;
  blurRef.current = blur;

  const focused = context?.focusedId === id;

  useEffect(() => {
    if (!context) return;

    const element: FocusableElement = {
      id,
      onUp: () => handlersRef.current.onUp?.() ?? false,
      onDown: () => handlersRef.current.onDown?.() ?? false,
      onLeft: () => handlersRef.current.onLeft?.() ?? false,
      onRight: () => handlersRef.current.onRight?.() ?? false,
      getBounds: () => containerRef.current?.getBoundingClientRect() ?? new DOMRect(),
      focus,
      blur,
    };

    const unregister = context.registerElement(id, element);
    return unregister;
  }, [context, id, focus, blur]);

  // Handle keyboard events
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !focused) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!context) return;

      let handled = false;
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          if (handlersRef.current.onUp) {
            handled = handlersRef.current.onUp();
          }
          if (!handled) {
            // Automatically find closest element in the up direction
            context.onOverscroll("up", id);
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (handlersRef.current.onDown) {
            handled = handlersRef.current.onDown();
          }
          if (!handled) {
            // Automatically find closest element in the down direction
            context.onOverscroll("down", id);
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (handlersRef.current.onLeft) {
            handled = handlersRef.current.onLeft();
          }
          if (!handled) {
            // Automatically find closest element in the left direction
            context.onOverscroll("left", id);
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (handlersRef.current.onRight) {
            handled = handlersRef.current.onRight();
          }
          if (!handled) {
            // Automatically find closest element in the right direction
            context.onOverscroll("right", id);
          }
          break;
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    container.setAttribute("tabindex", "0");
    if (focused) {
      container.focus();
    }

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, [focused, context, id]);

  return {
    focused,
    focus,
    blur,
    containerRef,
  };
}

// Provider component
function FocusProvider({
  children,
  onOverscroll,
}: {
  children: React.ReactNode;
  onOverscroll?: (direction: "up" | "down" | "left" | "right", fromId: string) => void;
}) {
  const elementsRef = useRef<Map<string, FocusableElement>>(new Map());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [elementCount, setElementCount] = useState(0);

  const registerElement = useCallback((id: string, element: FocusableElement) => {
    const wasEmpty = elementsRef.current.size === 0;
    elementsRef.current.set(id, element);
    setElementCount((prev) => prev + 1);
    
    // Auto-focus the first element if nothing is focused yet
    if (focusedId === null && wasEmpty) {
      requestAnimationFrame(() => {
        setFocusedId(id);
        element.focus();
      });
    }
    
    return () => {
      elementsRef.current.delete(id);
      setElementCount((prev) => prev - 1);
      // If the focused element is removed, focus the first remaining element
      if (focusedId === id && elementsRef.current.size > 0) {
        const firstElement = Array.from(elementsRef.current.values())[0];
        if (firstElement) {
          requestAnimationFrame(() => {
            setFocusedId(firstElement.id);
            firstElement.focus();
          });
        } else {
          setFocusedId(null);
        }
      }
    };
  }, [focusedId]);

  const getElement = useCallback((id: string) => {
    return elementsRef.current.get(id);
  }, []);

  const getAllElements = useCallback(() => {
    return elementsRef.current;
  }, []);

  const handleOverscroll = useCallback(
    (direction: "up" | "down" | "left" | "right", fromId: string) => {
      const fromElement = elementsRef.current.get(fromId);
      if (!fromElement) {
        console.log(`[Navigation] No element found for id: ${fromId}`);
        return;
      }

      const fromBounds = fromElement.getBounds();
      const allElements = Array.from(elementsRef.current.values());

      console.log(`\n[Navigation] Key pressed: ${direction.toUpperCase()} from element: ${fromId}`);
      console.log(`[Navigation] Total elements: ${allElements.length}`);

      // Calculate centroid of current element
      const fromCentroid = {
        x: (fromBounds.left + fromBounds.right) / 2,
        y: (fromBounds.top + fromBounds.bottom) / 2,
      };

      console.log(`[Navigation] From centroid: (${fromCentroid.x.toFixed(2)}, ${fromCentroid.y.toFixed(2)})`);
      console.log(`[Navigation] From bounds:`, {
        left: fromBounds.left.toFixed(2),
        top: fromBounds.top.toFixed(2),
        right: fromBounds.right.toFixed(2),
        bottom: fromBounds.bottom.toFixed(2),
      });

      // Direction vector (normalized)
      const directionVector = {
        up: { x: 0, y: -1 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
        right: { x: 1, y: 0 },
      }[direction];

      console.log(`[Navigation] Direction vector: (${directionVector.x}, ${directionVector.y})`);

      let bestElement: FocusableElement | null = null;
      let bestScore = -Infinity;
      const candidates: Array<{
        id: string;
        centroid: { x: number; y: number };
        toCandidate: { x: number; y: number };
        dotProduct: number;
        distance: number;
        cosineSimilarity: number;
        score: number;
        skipped: boolean;
        reason?: string;
      }> = [];

      for (const element of allElements) {
        if (element.id === fromId) {
          candidates.push({
            id: element.id,
            centroid: { x: 0, y: 0 },
            toCandidate: { x: 0, y: 0 },
            dotProduct: 0,
            distance: 0,
            cosineSimilarity: 0,
            score: 0,
            skipped: true,
            reason: "Current element",
          });
          continue;
        }

        const bounds = element.getBounds();
        
        // Calculate centroid of candidate element
        const candidateCentroid = {
          x: (bounds.left + bounds.right) / 2,
          y: (bounds.top + bounds.bottom) / 2,
        };

        // Vector from current centroid to candidate centroid
        const toCandidate = {
          x: candidateCentroid.x - fromCentroid.x,
          y: candidateCentroid.y - fromCentroid.y,
        };

        // Skip if element is in the wrong direction (behind us)
        // For strict directional navigation, we require the component in the direction to be positive
        // But we allow some tolerance for diagonal navigation
        const dotProduct = toCandidate.x * directionVector.x + toCandidate.y * directionVector.y;
        
        // Check if element is primarily in the wrong direction
        // For horizontal directions (left/right), check x component
        // For vertical directions (up/down), check y component
        let isWrongDirection = false;
        if (direction === "left" && toCandidate.x >= 0) {
          isWrongDirection = true;
        } else if (direction === "right" && toCandidate.x <= 0) {
          isWrongDirection = true;
        } else if (direction === "up" && toCandidate.y >= 0) {
          isWrongDirection = true;
        } else if (direction === "down" && toCandidate.y <= 0) {
          isWrongDirection = true;
        }
        
        if (isWrongDirection || dotProduct <= 0) {
          candidates.push({
            id: element.id,
            centroid: candidateCentroid,
            toCandidate,
            dotProduct,
            distance: 0,
            cosineSimilarity: 0,
            score: 0,
            skipped: true,
            reason: `Wrong direction (dotProduct: ${dotProduct.toFixed(2)}, toCandidate: (${toCandidate.x.toFixed(2)}, ${toCandidate.y.toFixed(2)}))`,
          });
          continue;
        }

        // Calculate cosine similarity
        const magnitudeToCandidate = Math.sqrt(
          toCandidate.x * toCandidate.x + toCandidate.y * toCandidate.y
        );
        const magnitudeDirection = Math.sqrt(
          directionVector.x * directionVector.x + directionVector.y * directionVector.y
        );

        if (magnitudeToCandidate === 0) {
          candidates.push({
            id: element.id,
            centroid: candidateCentroid,
            toCandidate,
            dotProduct,
            distance: 0,
            cosineSimilarity: 0,
            score: 0,
            skipped: true,
            reason: "Same position",
          });
          continue; // Skip if same position
        }

        const cosineSimilarity = dotProduct / (magnitudeToCandidate * magnitudeDirection);

        // Score combines cosine similarity (direction alignment) and inverse distance (closeness)
        // Higher cosine similarity = better direction match
        // Smaller distance = closer element
        // We want to maximize: cosine similarity / distance
        const distance = magnitudeToCandidate;
        const score = cosineSimilarity / (distance + 1); // +1 to avoid division by zero

        candidates.push({
          id: element.id,
          centroid: candidateCentroid,
          toCandidate,
          dotProduct,
          distance,
          cosineSimilarity,
          score,
          skipped: false,
        });

        if (score > bestScore) {
          bestScore = score;
          bestElement = element;
        }
      }

      console.log(`[Navigation] Candidates (${candidates.length} total):`);
      candidates.forEach((c, idx) => {
        if (c.skipped) {
          console.log(`  ${idx + 1}. ${c.id}: SKIPPED - ${c.reason}`);
        } else {
          console.log(`  ${idx + 1}. ${c.id}:`, {
            centroid: `(${c.centroid.x.toFixed(2)}, ${c.centroid.y.toFixed(2)})`,
            toCandidate: `(${c.toCandidate.x.toFixed(2)}, ${c.toCandidate.y.toFixed(2)})`,
            dotProduct: c.dotProduct.toFixed(4),
            distance: c.distance.toFixed(2),
            cosineSimilarity: c.cosineSimilarity.toFixed(4),
            score: c.score.toFixed(6),
          });
        }
      });

      if (bestElement) {
        console.log(`[Navigation] ✅ Selected: ${bestElement.id} (score: ${bestScore.toFixed(6)})`);
        // Use requestAnimationFrame to prevent flickering
        requestAnimationFrame(() => {
          setFocusedId(bestElement!.id);
          bestElement!.focus();
          if (onOverscroll) {
            onOverscroll(direction, fromId);
          }
        });
      } else {
        console.log(`[Navigation] ❌ No candidate found`);
      }
    },
    [onOverscroll]
  );

  const contextValue: FocusContextValue = {
    registerElement,
    getElement,
    getAllElements,
    onOverscroll: handleOverscroll,
    focusedId,
    setFocusedId,
  };

  return (
    <FocusContext.Provider value={contextValue}>
      {children}
    </FocusContext.Provider>
  );
}

// Focusable container component
function FocusableContainer({
  id,
  children,
  onUp,
  onDown,
  onLeft,
  onRight,
  className = "",
  style,
}: {
  id: string;
  children: React.ReactNode;
  onUp?: () => boolean;
  onDown?: () => boolean;
  onLeft?: () => boolean;
  onRight?: () => boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { focused, focus, blur, containerRef } = useFocus({
    id,
    onUp,
    onDown,
    onLeft,
    onRight,
  });

  const context = useContext(FocusContext);

  // Focus on click
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const handleClick = () => {
        focus();
      };
      container.addEventListener("click", handleClick);
      return () => {
        container.removeEventListener("click", handleClick);
      };
    }
  }, [focus, containerRef]);

  return (
    <div
      ref={containerRef}
      className={`border border-black dark:border-white relative ${className}`}
      style={{
        outline: focused ? "2px solid red" : "none",
        outlineOffset: "-2px",
        ...style,
      }}
      onClick={focus}
      onBlur={blur}
    >
      {focused && (
        <div className="absolute top-2 left-2 z-10">
          <FocusIndicator variant="dot" />
        </div>
      )}
      {children}
    </div>
  );
}

// Helper hook to get focus context
function useFocusContext() {
  return useContext(FocusContext);
}

// Example: Row of 3 items
function RowsOfThree() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const items = Array.from({ length: 3 }, (_, i) => i);
  const context = useFocusContext();

  // Update selected index when focus changes
  useEffect(() => {
    if (context?.focusedId) {
      const match = context.focusedId.match(/row-(\d+)/);
      if (match) {
        setSelectedIndex(parseInt(match[1], 10));
      }
    }
  }, [context?.focusedId]);

  return (
    <div className="w-full h-full p-8 flex flex-col gap-4">
      <h2 className="text-xl font-mono mb-4">Rows of 3</h2>
      {items.map((item, index) => (
        <FocusableContainer
          key={item}
          id={`row-${item}`}
          className="p-4 min-h-[100px]"
        >
          <div className="font-mono text-sm">
            Row {item + 1}
            {selectedIndex === index && (
              <span className="ml-2 opacity-60">(selected)</span>
            )}
          </div>
        </FocusableContainer>
      ))}
    </div>
  );
}

function RowsOfThreeWrapper() {
  return (
    <FocusProvider>
      <RowsOfThree />
    </FocusProvider>
  );
}

// Example: Column of 3 items
function ColumnOfThree() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const items = Array.from({ length: 3 }, (_, i) => i);
  const context = useFocusContext();

  // Update selected index when focus changes
  useEffect(() => {
    if (context?.focusedId) {
      const match = context.focusedId.match(/col-(\d+)/);
      if (match) {
        setSelectedIndex(parseInt(match[1], 10));
      }
    }
  }, [context?.focusedId]);

  return (
    <div className="w-full h-full p-8 flex gap-4">
      {items.map((item, index) => (
        <FocusableContainer
          key={item}
          id={`col-${item}`}
          className="p-4 flex-1 min-w-[200px]"
        >
          <div className="font-mono text-sm">
            Column {item + 1}
            {selectedIndex === index && (
              <span className="ml-2 opacity-60">(selected)</span>
            )}
          </div>
        </FocusableContainer>
      ))}
    </div>
  );
}

function ColumnOfThreeWrapper() {
  return (
    <FocusProvider>
      <ColumnOfThree />
    </FocusProvider>
  );
}

// Example: 3x3 Grid
function Grid3x3() {
  const [selectedRow, setSelectedRow] = useState(0);
  const [selectedCol, setSelectedCol] = useState(0);
  const rows = Array.from({ length: 3 }, (_, i) => i);
  const cols = Array.from({ length: 3 }, (_, i) => i);
  const context = useFocusContext();

  const getCellId = (row: number, col: number) => `cell-${row}-${col}`;

  // Update selected row/col when focus changes
  useEffect(() => {
    if (context?.focusedId) {
      const match = context.focusedId.match(/cell-(\d+)-(\d+)/);
      if (match) {
        setSelectedRow(parseInt(match[1], 10));
        setSelectedCol(parseInt(match[2], 10));
      }
    }
  }, [context?.focusedId]);

  return (
    <div className="w-full h-full p-8 flex flex-col gap-4">
      <h2 className="text-xl font-mono mb-4">Grid 3x3</h2>
      <div
        className="flex-1"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1rem",
        }}
      >
        {rows.map((row) =>
          cols.map((col) => (
            <FocusableContainer
              key={getCellId(row, col)}
              id={getCellId(row, col)}
              className="p-4 min-h-[150px]"
            >
              <div className="font-mono text-sm">
                Cell ({row + 1}, {col + 1})
                {selectedRow === row && selectedCol === col && (
                  <span className="ml-2 opacity-60">(selected)</span>
                )}
              </div>
            </FocusableContainer>
          ))
        )}
      </div>
    </div>
  );
}

function Grid3x3Wrapper() {
  return (
    <FocusProvider>
      <Grid3x3 />
    </FocusProvider>
  );
}

// Example: 2-3-2 columns grid
function Grid232() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const columns = [2, 3, 2]; // Column widths
  const items = Array.from({ length: 7 }, (_, i) => i);
  const context = useFocusContext();

  // Distribute items across columns
  const columnItems: number[][] = [[], [], []];
  let currentCol = 0;
  let itemsInCurrentCol = 0;
  items.forEach((item) => {
    columnItems[currentCol].push(item);
    itemsInCurrentCol++;
    if (itemsInCurrentCol >= columns[currentCol] && currentCol < 2) {
      currentCol++;
      itemsInCurrentCol = 0;
    }
  });

  // Update selected index when focus changes
  useEffect(() => {
    if (context?.focusedId) {
      const match = context.focusedId.match(/item-(\d+)/);
      if (match) {
        setSelectedIndex(parseInt(match[1], 10));
      }
    }
  }, [context?.focusedId]);

  return (
    <div className="w-full h-full p-8 flex flex-col gap-4">
      <h2 className="text-xl font-mono mb-4">2-3-2 Columns Grid</h2>
      <div className="flex gap-4 flex-1">
        {columnItems.map((colItems, colIndex) => (
          <div
            key={colIndex}
            className="flex flex-col gap-4"
            style={{ flex: columns[colIndex] }}
          >
            {colItems.map((item, itemIndex) => {
              return (
                <FocusableContainer
                  key={item}
                  id={`item-${item}`}
                  className="p-4 min-h-[100px]"
                >
                  <div className="font-mono text-sm">
                    Item {item + 1} (Col {colIndex + 1})
                    {selectedIndex === item && (
                      <span className="ml-2 opacity-60">(selected)</span>
                    )}
                  </div>
                </FocusableContainer>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function Grid232Wrapper() {
  return (
    <FocusProvider>
      <Grid232 />
    </FocusProvider>
  );
}

export const RowsOfThreeExample: Story = {
  render: () => <RowsOfThreeWrapper />,
};

export const ColumnOfThreeExample: Story = {
  render: () => <ColumnOfThreeWrapper />,
};

export const Grid3x3Example: Story = {
  render: () => <Grid3x3Wrapper />,
};

export const Grid232Example: Story = {
  render: () => <Grid232Wrapper />,
};

