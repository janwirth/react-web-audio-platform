import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useRef, useState } from "react";
import { FocusIndicator } from "../FocusIndicator";
import { Column } from "../../ui/Column";
import { Row } from "../../ui/Row";
import {
  focusElementTo,
  useIsFocused,
  useKeydownIfFocussed,
} from "./focusHooks";

const meta = {
  title: "Stories/LayoutAndControl/Focus/KeypressLog",
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function FocusableWithKeypressLog({
  label,
  autoFocus,
}: {
  label: string;
  autoFocus: boolean;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const isFocused = useIsFocused(elementRef);
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    if (autoFocus && elementRef.current) {
      elementRef.current.focus();
    }
  }, [autoFocus]);

  useKeydownIfFocussed(elementRef, (e) => {
    console.log(`[${label}] Key pressed:`, {
      key: e.key,
      code: e.code,
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      metaKey: e.metaKey,
    });
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setCounter((prev) => {
        if (prev === 0) {
          // Already at min, navigate to next element
          focusElementTo("ArrowUp", elementRef);
          return prev;
        }
        return prev - 1;
      });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setCounter((prev) => {
        if (prev === 5) {
          // Already at max, navigate to next element
          focusElementTo("ArrowDown", elementRef);
          return prev;
        }
        return prev + 1;
      });
    } else if (e.key === "ArrowLeft") {
      focusElementTo("ArrowLeft", elementRef);
    } else if (e.key === "ArrowRight") {
      focusElementTo("ArrowRight", elementRef);
    }
  });

  return (
    <Column
      ref={elementRef}
      tabIndex={0}
      className="font-mono p-4 border border-current outline-none relative"
    >
      <div className="text-sm font-semibold mb-2 opacity-100">{label}</div>
      <Column className="text-xs opacity-80 flex-1 items-center justify-center gap-2">
        <Column className="gap-2 w-full items-center">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className={`flex w-full h-0.5 relative items-center justify-center ${
                counter === index
                  ? "bg-red-700 dark:bg-red-300"
                  : "bg-gray-200 dark:bg-gray-800"
              }`}
            >
              {isFocused && counter === index && (
                <FocusIndicator></FocusIndicator>
              )}
            </div>
          ))}
        </Column>
        {isFocused
          ? "Focused - Press keys to see logs"
          : "Not focused - Click to focus"}
      </Column>
    </Column>
  );
}

function KeypressLogDemo() {
  const labels = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];

  return (
    <Column>
      {/* First Row */}
      <Row>
        <Column className="p-4">
          <FocusableWithKeypressLog
            autoFocus={true}
            label={`Focusable ${labels[0]}`}
          />
        </Column>
        <Column className="p-4">
          <FocusableWithKeypressLog
            autoFocus={false}
            label={`Focusable ${labels[1]}`}
          />
        </Column>
        <Column className="p-4">
          <FocusableWithKeypressLog
            autoFocus={false}
            label={`Focusable ${labels[2]}`}
          />
        </Column>
      </Row>

      {/* Second Row */}
      <Row>
        <Column className="p-4">
          <FocusableWithKeypressLog
            autoFocus={false}
            label={`Focusable ${labels[3]}`}
          />
        </Column>
        <Column className="p-4">
          <FocusableWithKeypressLog
            autoFocus={false}
            label={`Focusable ${labels[4]}`}
          />
        </Column>
        <Column className="p-4">
          <FocusableWithKeypressLog
            autoFocus={false}
            label={`Focusable ${labels[5]}`}
          />
        </Column>
      </Row>

      {/* Third Row */}
      <Row>
        <Column className="p-4">
          <FocusableWithKeypressLog
            autoFocus={false}
            label={`Focusable ${labels[6]}`}
          />
        </Column>
        <Column className="p-4">
          <FocusableWithKeypressLog
            autoFocus={false}
            label={`Focusable ${labels[7]}`}
          />
        </Column>
        <Column className="p-4">
          <FocusableWithKeypressLog
            autoFocus={false}
            label={`Focusable ${labels[8]}`}
          />
        </Column>
      </Row>
    </Column>
  );
}

export const Default: Story = {
  render: () => <KeypressLogDemo />,
};
