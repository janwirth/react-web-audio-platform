import type { Meta, StoryObj } from "@storybook/react";
import { useMemo, useState, useEffect, useRef } from "react";

const meta = {
  title: "Stories/LayoutAndControl/SpatialCursor2d",
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function SpatialCursor2dDemo() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const containerRef = useRef<HTMLDivElement>(null);

  const letterPositions = useMemo(() => {
    return letters.map((letter) => ({
      letter,
      top: Math.random() * 90, // 0-90vh to leave some margin
      left: Math.random() * 90, // 0-90vw to leave some margin
    }));
  }, []);

  // Find the centermost letter on initial load
  const initialFocusedIndex = useMemo(() => {
    const centerX = 50; // 50vw
    const centerY = 50; // 50vh

    let closestIndex = 0;
    let closestDistance = Infinity;

    letterPositions.forEach((pos, index) => {
      const distance = Math.sqrt(
        Math.pow(pos.left - centerX, 2) + Math.pow(pos.top - centerY, 2)
      );
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }, [letterPositions]);

  const [focusedIndex, setFocusedIndex] = useState(initialFocusedIndex);

  // Update focused index when initial position changes
  useEffect(() => {
    setFocusedIndex(initialFocusedIndex);
  }, [initialFocusedIndex]);

  // Handle arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        return;
      }

      e.preventDefault();

      const currentPos = letterPositions[focusedIndex];
      let candidates: Array<{ index: number; distance: number }> = [];

      switch (e.key) {
        case "ArrowRight":
          // Find letters to the right (left > current.left)
          candidates = letterPositions
            .map((pos, index) => ({
              index,
              distance: Math.sqrt(
                Math.pow(pos.left - currentPos.left, 2) +
                  Math.pow(pos.top - currentPos.top, 2)
              ),
            }))
            .filter((candidate) => letterPositions[candidate.index].left > currentPos.left);
          break;
        case "ArrowLeft":
          // Find letters to the left (left < current.left)
          candidates = letterPositions
            .map((pos, index) => ({
              index,
              distance: Math.sqrt(
                Math.pow(pos.left - currentPos.left, 2) +
                  Math.pow(pos.top - currentPos.top, 2)
              ),
            }))
            .filter((candidate) => letterPositions[candidate.index].left < currentPos.left);
          break;
        case "ArrowDown":
          // Find letters below (top > current.top)
          candidates = letterPositions
            .map((pos, index) => ({
              index,
              distance: Math.sqrt(
                Math.pow(pos.left - currentPos.left, 2) +
                  Math.pow(pos.top - currentPos.top, 2)
              ),
            }))
            .filter((candidate) => letterPositions[candidate.index].top > currentPos.top);
          break;
        case "ArrowUp":
          // Find letters above (top < current.top)
          candidates = letterPositions
            .map((pos, index) => ({
              index,
              distance: Math.sqrt(
                Math.pow(pos.left - currentPos.left, 2) +
                  Math.pow(pos.top - currentPos.top, 2)
              ),
            }))
            .filter((candidate) => letterPositions[candidate.index].top < currentPos.top);
          break;
      }

      if (candidates.length > 0) {
        // Find the candidate with the smallest distance
        const nearest = candidates.reduce((min, candidate) =>
          candidate.distance < min.distance ? candidate : min
        );
        setFocusedIndex(nearest.index);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("keydown", handleKeyDown);
      container.focus();
    }

    return () => {
      if (container) {
        container.removeEventListener("keydown", handleKeyDown);
      }
    };
  }, [focusedIndex, letterPositions]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      tabIndex={0}
      style={{
        fontFamily: "monospace",
        position: "relative",
        outline: "none",
      }}
    >
      {letterPositions.map(({ letter, top, left }, index) => (
        <div
          key={letter}
          style={{
            position: "absolute",
            top: `${top}vh`,
            left: `${left}vw`,
            color: index === focusedIndex ? "green" : undefined,
          }}
        >
          {letter}
        </div>
      ))}
    </div>
  );
}

export const Default: Story = {
  render: () => <SpatialCursor2dDemo />,
  parameters: {
    layout: "fullscreen",
  },
};

