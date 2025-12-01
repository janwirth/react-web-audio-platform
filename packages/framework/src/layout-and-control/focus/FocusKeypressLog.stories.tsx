import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useRef, useState } from "react";
import { findClosestInDirection } from "../findClosestInDirection";
import { FocusIndicator } from "../FocusIndicator";

const meta = {
  title: "Stories/LayoutAndControl/Focus/KeypressLog",
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const useKeydownIfFocussed = (
  ref: React.RefObject<HTMLElement | null>,
  callback: (e: KeyboardEvent) => void
) => {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const keydownHandler = (e: KeyboardEvent) => {
      console.log("keydown", e);
      callback(e);
    };

    const handleFocus = () => {
      console.log("adding event listeners");
      element.addEventListener("keydown", keydownHandler);
    };

    const handleBlur = () => {
      console.log("removing event listeners");
      element.removeEventListener("keydown", keydownHandler);
    };

    // Check if element is already focused
    if (document.activeElement === element) {
      handleFocus();
    }

    element.addEventListener("focus", handleFocus);
    element.addEventListener("blur", handleBlur);

    return () => {
      element.removeEventListener("focus", handleFocus);
      element.removeEventListener("blur", handleBlur);
      element.removeEventListener("keydown", keydownHandler);
    };
  }, [ref, callback]);
};

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
    <div
      ref={elementRef}
      tabIndex={0}
      className="h-full flex flex-col font-mono p-4 border border-current outline-none relative"
    >
      <div className="text-sm font-semibold mb-2 opacity-100">{label}</div>
      <div className="text-xs opacity-80 flex-1 flex items-center justify-center flex-col gap-2">
        <div className="flex flex-col gap-2 w-full items-center">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className={`w-full h-0.5 relative flex items-center justify-center ${
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
        </div>
        {isFocused
          ? "Focused - Press keys to see logs"
          : "Not focused - Click to focus"}
      </div>
    </div>
  );
}

function KeypressLogDemo() {
  const labels = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];

  return (
    <div className="h-screen w-full flex flex-col">
      {/* First Row */}
      <div className="flex-1 flex flex-row">
        <div className="flex-1 p-4">
          <FocusableWithKeypressLog
            autoFocus={true}
            label={`Focusable ${labels[0]}`}
          />
        </div>
        <div className="flex-1 p-4">
          <FocusableWithKeypressLog
            autoFocus={false}
            label={`Focusable ${labels[1]}`}
          />
        </div>
        <div className="flex-1 p-4">
          <FocusableWithKeypressLog
            autoFocus={false}
            label={`Focusable ${labels[2]}`}
          />
        </div>
      </div>

      {/* Second Row */}
      <div className="flex-1 flex flex-row">
        <div className="flex-1 p-4">
          <FocusableWithKeypressLog
            autoFocus={false}
            label={`Focusable ${labels[3]}`}
          />
        </div>
        <div className="flex-1 p-4">
          <FocusableWithKeypressLog
            autoFocus={false}
            label={`Focusable ${labels[4]}`}
          />
        </div>
        <div className="flex-1 p-4">
          <FocusableWithKeypressLog
            autoFocus={false}
            label={`Focusable ${labels[5]}`}
          />
        </div>
      </div>

      {/* Third Row */}
      <div className="flex-1 flex flex-row">
        <div className="flex-1 p-4">
          <FocusableWithKeypressLog
            autoFocus={false}
            label={`Focusable ${labels[6]}`}
          />
        </div>
        <div className="flex-1 p-4">
          <FocusableWithKeypressLog
            autoFocus={false}
            label={`Focusable ${labels[7]}`}
          />
        </div>
        <div className="flex-1 p-4">
          <FocusableWithKeypressLog
            autoFocus={false}
            label={`Focusable ${labels[8]}`}
          />
        </div>
      </div>
    </div>
  );
}

export const Default: Story = {
  render: () => <KeypressLogDemo />,
};

const focusElementTo = (
  direction: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight",
  ref: React.RefObject<HTMLElement | null>
) => {
  if (!ref.current) return;
  const candidates = document.querySelectorAll<HTMLElement>(
    'div[tabindex]:not([tabindex="-1"])'
  );
  const closestElement = findClosestInDirection(
    direction,
    ref.current,
    Array.from(candidates)
  );
  if (closestElement) {
    closestElement.focus();
  }
};

const useIsFocused = (ref: React.RefObject<HTMLElement | null>) => {
  const [isFocused, setIsFocused] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.addEventListener("focus", () => setIsFocused(true));
    element.addEventListener("blur", () => setIsFocused(false));
    return () => {
      element.removeEventListener("focus", () => setIsFocused(false));
      element.removeEventListener("blur", () => setIsFocused(true));
    };
  }, [ref]);
  return isFocused;
};
