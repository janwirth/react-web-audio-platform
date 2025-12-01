import type { Meta, StoryObj } from "@storybook/react";
import { useState, useRef, useEffect } from "react";
import { Row } from "@/ui/Row";
import { Column } from "@/ui/Column";
import { Focusable, FocusProvider, useFocus } from "./Focus";
import { motion } from "motion/react";

const meta = {
  title: "Stories/LayoutAndControl/Focus",
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Counter component with overscroll
interface ScrollableProps {
  label?: string;
}

const MAX_VALUE = 5;

function Scrollable({ label }: ScrollableProps) {
  const [counter, setCounter] = useState(0);
  const { isFocused, ref } = useFocus();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref(containerRef.current);
  }, [ref]);

  useEffect(() => {
    if (!isFocused || !containerRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        if (counter >= MAX_VALUE) {
          // At max bound, trigger overscroll - don't prevent default
          // Let FocusProvider handle navigation
          return;
        } else {
          e.preventDefault();
          e.stopPropagation();
          setCounter((c) => c + 1);
        }
      } else if (e.key === "ArrowUp") {
        if (counter <= 0) {
          // At min bound, trigger overscroll - don't prevent default
          // Let FocusProvider handle navigation
          return;
        } else {
          e.preventDefault();
          e.stopPropagation();
          setCounter((c) => c - 1);
        }
      }
    };

    const container = containerRef.current;
    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFocused, counter]);

  return (
    <div
      ref={containerRef}
      className="space-y-2 text-xs opacity-80 h-full flex flex-col font-mono p-3"
    >
      {label && (
        <div className="text-sm font-semibold mb-2 opacity-100">{label}</div>
      )}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-4xl font-bold">{counter}</div>
      </div>
      <div className="text-xs opacity-60 mt-2">
        Max: {MAX_VALUE} | Arrow Down to increment | Arrow Up to decrement
      </div>
      {isFocused && <div className="text-xs opacity-60 mt-2">Focused</div>}
    </div>
  );
}

// Main demo with RowsColumnsMosaic-style layout
function FocusDemo() {
  return (
    <Column className="h-screen w-full">
      {/* First Row */}
      <Row className="flex-1 min-h-0">
        <Column className="flex-1 min-w-0 p-2.5">
          <Focusable className="h-full min-h-0">
            <Scrollable label="Counter A" />
          </Focusable>
        </Column>
        <Column className="flex-1 min-w-0 p-2.5">
          <Focusable className="h-full min-h-0">
            <Scrollable label="Counter B" />
          </Focusable>
        </Column>
        <Column className="flex-1 min-w-0 p-2.5">
          <Focusable className="h-full min-h-0">
            <Scrollable label="Counter C" />
          </Focusable>
        </Column>
      </Row>

      {/* Second Row */}
      <Row className="flex-1 min-h-0">
        <Column className="flex-1 min-w-0 p-2.5">
          <Focusable className="h-full min-h-0">
            <Scrollable label="Counter D" />
          </Focusable>
        </Column>
        <Column className="flex-1 min-w-0 p-2.5">
          <Focusable className="h-full min-h-0">
            <Scrollable label="Counter E" />
          </Focusable>
        </Column>
        <Column className="flex-1 min-w-0 p-2.5">
          <Focusable className="h-full min-h-0">
            <Scrollable label="Counter F" />
          </Focusable>
        </Column>
      </Row>
    </Column>
  );
}

function FocusDemoWrapper() {
  return (
    <FocusProvider>
      <FocusDemo />
    </FocusProvider>
  );
}

// Simple content component without scrolling
function SimpleContent({ label, content }: { label: string; content: string }) {
  const { isFocused, windowHasFocus } = useFocus();

  console.log("ISFOCUSED", isFocused);
  return (
    <div className="h-full flex flex-col relative font-mono p-3">
      <div className="text-sm font-semibold mb-2 opacity-100">{label}</div>
      <div className="text-xs opacity-80 flex-1 flex items-center justify-center">
        {content}
        {isFocused && (
          <motion.div
            transition={{ duration: 0.15, ease: "circOut" }}
            layoutId="focus-indicator"
            className={`absolute top-2 right-2 w-4 h-4 shrink-0 ${
              windowHasFocus ? "bg-white dark:bg-white" : "bg-gray-500"
            }`}
          />
        )}
      </div>
    </div>
  );
}

// Focus-only demo with same layout but no scrollable elements
function FocusOnlyDemo() {
  const { isFocused, windowHasFocus } = useFocus();
  return (
    <Column className="h-screen w-full relative">
      {/* First Row */}
      {isFocused && (
        <motion.div
          layoutId="focus-indicator"
          className={`absolute top-2 right-2 w-4 h-4 shrink-0 ${
            windowHasFocus ? "bg-white" : "bg-black"
          }`}
        />
      )}
      {isFocused && <div className="text-xs opacity-60 mt-2">Focused</div>}

      <Row className="flex-1 min-h-0">
        <Column className="flex-1">
          <Focusable className="h-full min-h-0">
            <SimpleContent label="Panel A" content="Focusable container A" />
          </Focusable>
        </Column>
        <Column className="flex-1 min-w-0 p-2.5">
          <Focusable className="h-full min-h-0">
            <SimpleContent label="Panel B" content="Focusable container B" />
          </Focusable>
        </Column>
        <Column className="flex-1 min-w-0 p-2.5">
          <Focusable className="h-full min-h-0">
            <SimpleContent label="Panel C" content="Focusable container C" />
          </Focusable>
        </Column>
      </Row>

      {/* Second Row */}
      <Row className="flex-1 min-h-0">
        <Column className="flex-1 min-w-0 p-2.5">
          <Focusable className="h-full min-h-0">
            <SimpleContent label="Panel D" content="Focusable container D" />
          </Focusable>
        </Column>
        <Column className="flex-1 min-w-0 p-2.5">
          <Focusable className="h-full min-h-0">
            <SimpleContent label="Panel E" content="Focusable container E" />
          </Focusable>
        </Column>
        <Column className="flex-1 min-w-0 p-2.5">
          <Focusable className="h-full min-h-0">
            <SimpleContent label="Panel F" content="Focusable container F" />
          </Focusable>
        </Column>
      </Row>
    </Column>
  );
}

function FocusOnlyDemoWrapper() {
  return (
    <FocusProvider>
      <FocusOnlyDemo />
    </FocusProvider>
  );
}

export const Default: Story = {
  render: () => <FocusDemoWrapper />,
};

export const FocusOnly: Story = {
  render: () => <FocusOnlyDemoWrapper />,
};
