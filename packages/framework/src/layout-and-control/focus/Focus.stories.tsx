import type { Meta, StoryObj } from "@storybook/react";
import { useState, useCallback } from "react";
import { Row } from "@/ui/Row";
import { Column } from "@/ui/Column";
import { Focusable, FocusProvider, useFocus } from "./Focus";

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

  const { isFocused, containerRef } = useFocus({
    onArrowDown: useCallback(() => {
      if (cursor >= items.length - 1) {
        setLastEvent("Arrow Down (overscroll)");
        return "overscroll-down";
      } else {
        setCursor((c) => c + 1);
        setLastEvent("Arrow Down");
        return;
      }
    }, [cursor, items.length]),
    onArrowUp: useCallback(() => {
      if (cursor <= 0) {
        setLastEvent("Arrow Up (overscroll)");
        return "overscroll-up";
      } else {
        setCursor((c) => c - 1);
        setLastEvent("Arrow Up");
        return;
      }
    }, [cursor]),
  });

  return (
    <div
      ref={containerRef}
      className="space-y-2 text-xs opacity-80 h-full flex flex-col"
      style={{
        fontFamily: "monospace",
        padding: "12px",
      }}
    >
      {label && (
        <div className="text-sm font-semibold mb-2 opacity-100">{label}</div>
      )}
      <div className="flex-1 overflow-y-auto">
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
    <Column className="h-full w-full" style={{ height: "100vh" }}>
      {/* First Row */}
      <Row className="flex-1" style={{ minHeight: 0 }}>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
            padding: "10px",
            overflow: "hidden",
          }}
        >
          <Focusable
            className="h-full"
            style={{
              minHeight: 0,
            }}
          >
            <Scrollable items={itemsA} label="List A" />
          </Focusable>
        </Column>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
            padding: "10px",
            overflow: "hidden",
          }}
        >
          <Focusable
            className="h-full"
            style={{
              minHeight: 0,
            }}
          >
            <Scrollable items={itemsB} label="List B" />
          </Focusable>
        </Column>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
            padding: "10px",
            overflow: "hidden",
          }}
        >
          <Focusable
            className="h-full"
            style={{
              minHeight: 0,
            }}
          >
            <Scrollable items={itemsC} label="List C" />
          </Focusable>
        </Column>
      </Row>

      {/* Second Row */}
      <Row className="flex-1" style={{ minHeight: 0 }}>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
            padding: "10px",
            overflow: "hidden",
          }}
        >
          <Focusable
            className="h-full"
            style={{
              minHeight: 0,
            }}
          >
            <Scrollable items={itemsD} label="List D" />
          </Focusable>
        </Column>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
            padding: "10px",
            overflow: "hidden",
          }}
        >
          <Focusable
            className="h-full"
            style={{
              minHeight: 0,
            }}
          >
            <Scrollable items={itemsA} label="List E" />
          </Focusable>
        </Column>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
            padding: "10px",
            overflow: "hidden",
          }}
        >
          <Focusable
            className="h-full"
            style={{
              minHeight: 0,
            }}
          >
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
  return (
    <div
      className="h-full flex flex-col"
      style={{
        fontFamily: "monospace",
        padding: "12px",
      }}
    >
      <div className="text-sm font-semibold mb-2 opacity-100">{label}</div>
      <div className="text-xs opacity-80 flex-1 flex items-center justify-center">
        {content}
      </div>
    </div>
  );
}

// Focus-only demo with same layout but no scrollable elements
function FocusOnlyDemo() {
  return (
    <Column className="h-full w-full" style={{ height: "100vh" }}>
      {/* First Row */}
      <Row className="flex-1" style={{ minHeight: 0 }}>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
            padding: "10px",
            overflow: "hidden",
          }}
        >
          <Focusable
            className="h-full"
            style={{
              minHeight: 0,
            }}
          >
            <SimpleContent label="Panel A" content="Focusable container A" />
          </Focusable>
        </Column>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
            padding: "10px",
            overflow: "hidden",
          }}
        >
          <Focusable
            className="h-full"
            style={{
              minHeight: 0,
            }}
          >
            <SimpleContent label="Panel B" content="Focusable container B" />
          </Focusable>
        </Column>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
            padding: "10px",
            overflow: "hidden",
          }}
        >
          <Focusable
            className="h-full"
            style={{
              minHeight: 0,
            }}
          >
            <SimpleContent label="Panel C" content="Focusable container C" />
          </Focusable>
        </Column>
      </Row>

      {/* Second Row */}
      <Row className="flex-1" style={{ minHeight: 0 }}>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
            padding: "10px",
            overflow: "hidden",
          }}
        >
          <Focusable
            className="h-full"
            style={{
              minHeight: 0,
            }}
          >
            <SimpleContent label="Panel D" content="Focusable container D" />
          </Focusable>
        </Column>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
            padding: "10px",
            overflow: "hidden",
          }}
        >
          <Focusable
            className="h-full"
            style={{
              minHeight: 0,
            }}
          >
            <SimpleContent label="Panel E" content="Focusable container E" />
          </Focusable>
        </Column>
        <Column
          className="flex-1"
          style={{
            minWidth: 0,
            padding: "10px",
            overflow: "hidden",
          }}
        >
          <Focusable
            className="h-full"
            style={{
              minHeight: 0,
            }}
          >
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
