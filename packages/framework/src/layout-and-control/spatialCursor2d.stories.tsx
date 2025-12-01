import type { Meta, StoryObj } from "@storybook/react";
import { useMemo, useState, useEffect, useRef } from "react";
import { findClosestInDirection } from "./findClosestInDirection";

const meta = {
  title: "Stories/LayoutAndControl/SpatialCursor2d",
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Finds the closest element from candidates using centroids and bounding client rects
 * @param ref - The reference element to measure distance from
 * @param candidates - Array of candidate elements to search through
 * @returns The closest candidate element, or null if no valid candidates
 */
function findClosestElement(
  ref: HTMLElement | null,
  candidates: HTMLElement[]
): HTMLElement | null {
  if (!ref || candidates.length === 0) {
    return null;
  }

  const refRect = ref.getBoundingClientRect();
  const refCentroid = {
    x: refRect.left + refRect.width / 2,
    y: refRect.top + refRect.height / 2,
  };

  let closestElement: HTMLElement | null = null;
  let closestDistance = Infinity;

  for (const candidate of candidates) {
    const candidateRect = candidate.getBoundingClientRect();
    const candidateCentroid = {
      x: candidateRect.left + candidateRect.width / 2,
      y: candidateRect.top + candidateRect.height / 2,
    };

    const distance = Math.sqrt(
      Math.pow(candidateCentroid.x - refCentroid.x, 2) +
        Math.pow(candidateCentroid.y - refCentroid.y, 2)
    );

    if (distance < closestDistance) {
      closestDistance = distance;
      closestElement = candidate;
    }
  }

  return closestElement;
}

function SpatialCursor2dDemo() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const containerRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<(HTMLDivElement | null)[]>([]);

  const letterPositions = useMemo(() => {
    return letters.map((letter) => ({
      letter,
      top: Math.random() * 90, // 0-90vh to leave some margin
      left: Math.random() * 90, // 0-90vw to leave some margin
    }));
  }, []);

  const [focusedIndex, setFocusedIndex] = useState(0);

  // Find the centermost letter on initial load
  useEffect(() => {
    if (
      !containerRef.current ||
      letterRefs.current.length === 0 ||
      !letterRefs.current.every((ref) => ref !== null)
    ) {
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerCentroid = {
      x: containerRect.left + containerRect.width / 2,
      y: containerRect.top + containerRect.height / 2,
    };

    // Create a temporary element at the center for reference
    const tempRef = document.createElement("div");
    tempRef.style.position = "fixed";
    tempRef.style.left = `${containerCentroid.x}px`;
    tempRef.style.top = `${containerCentroid.y}px`;
    tempRef.style.width = "0";
    tempRef.style.height = "0";
    document.body.appendChild(tempRef);

    const candidates = letterRefs.current.filter(
      (ref): ref is HTMLDivElement => ref !== null
    );
    const closest = findClosestElement(tempRef, candidates);
    document.body.removeChild(tempRef);

    if (closest) {
      const index = letterRefs.current.indexOf(closest as HTMLDivElement);
      if (index !== -1) {
        setFocusedIndex(index);
      }
    }
  }, [letterPositions]);

  // Handle arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
      ) {
        return;
      }

      e.preventDefault();

      const currentRef = letterRefs.current[focusedIndex];
      if (!currentRef) {
        return;
      }

      const allRefs = letterRefs.current.filter(
        (ref): ref is HTMLDivElement => ref !== null
      );

      const closest = findClosestInDirection(
        e.key as "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight",
        currentRef,
        allRefs
      );

      if (closest) {
        const index = letterRefs.current.indexOf(closest as HTMLDivElement);
        if (index !== -1) {
          setFocusedIndex(index);
        }
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
          ref={(el) => {
            letterRefs.current[index] = el;
          }}
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
