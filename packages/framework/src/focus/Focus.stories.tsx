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

// Scrollable component based on HotkeyDebuggerSection
interface ScrollableProps {
  items: string[];
  label?: string;
}

function Scrollable({ items, label }: ScrollableProps) {
  const [cursor, setCursor] = useState(0);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  const { isFocused, ref } = useFocus();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref(containerRef.current);
  }, [ref]);

  return (
    <div
      ref={containerRef}
      className="space-y-2 text-xs opacity-80 h-full flex flex-col font-mono p-3"
    >
      {label && (
        <div className="text-sm font-semibold mb-2 opacity-100">{label}</div>
      )}
      <div className="flex-1">
        {items.map((item, i) => (
          <div
            key={i}
            className={`py-1 px-2 ${
              i === cursor ? "opacity-100" : "opacity-60"
            } ${i === cursor ? "border-l-2 border-l-current" : ""}`}
          >
            {item}
          </div>
        ))}
      </div>
      {lastEvent && (
        <div className="mt-4 pt-2 border-t border-current opacity-40 text-xs">
          Last event: {lastEvent}
        </div>
      )}
      {isFocused && <div className="text-xs opacity-60 mt-2">Focused</div>}
    </div>
  );
}

// Main demo with RowsColumnsMosaic-style layout
function FocusDemo() {
  const itemsA = Array.from({ length: 20 }, (_, i) => `Item A-${i + 1}`);
  const itemsB = Array.from({ length: 15 }, (_, i) => `Item B-${i + 1}`);
  const itemsC = Array.from({ length: 25 }, (_, i) => `Item C-${i + 1}`);
  const itemsD = Array.from({ length: 12 }, (_, i) => `Item D-${i + 1}`);

  return (
    <Column className="h-screen w-full">
      {/* First Row */}
      <Row className="flex-1 min-h-0">
        <Column className="flex-1 min-w-0 p-2.5">
          <Focusable className="h-full min-h-0">
            <Scrollable items={itemsA} label="List A" />
          </Focusable>
        </Column>
        <Column className="flex-1 min-w-0 p-2.5">
          <Focusable className="h-full min-h-0">
            <Scrollable items={itemsB} label="List B" />
          </Focusable>
        </Column>
        <Column className="flex-1 min-w-0 p-2.5">
          <Focusable className="h-full min-h-0">
            <Scrollable items={itemsC} label="List C" />
          </Focusable>
        </Column>
      </Row>

      {/* Second Row */}
      <Row className="flex-1 min-h-0">
        <Column className="flex-1 min-w-0 p-2.5">
          <Focusable className="h-full min-h-0">
            <Scrollable items={itemsD} label="List D" />
          </Focusable>
        </Column>
        <Column className="flex-1 min-w-0 p-2.5">
          <Focusable className="h-full min-h-0">
            <Scrollable items={itemsA} label="List E" />
          </Focusable>
        </Column>
        <Column className="flex-1 min-w-0 p-2.5">
          <Focusable className="h-full min-h-0">
            <Scrollable items={itemsB} label="List F" />
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
