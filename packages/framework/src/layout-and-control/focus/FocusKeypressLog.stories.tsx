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
      focusElementTo("ArrowUp", elementRef);
    } else if (e.key === "ArrowDown") {
      focusElementTo("ArrowDown", elementRef);
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
      <div className="text-xs opacity-80 flex-1 flex items-center justify-center">
        {isFocused
          ? "Focused - Press keys to see logs"
          : "Not focused - Click to focus"}
      </div>
      {isFocused && (
        <div className="text-xs opacity-60 mt-2">
          Check console for keypress logs
        </div>
      )}
      {isFocused && <FocusIndicator></FocusIndicator>}
    </div>
  );
}
const FocusableExample = ({ label }: { label: string }) => {
  return (
    <div className="h-full flex flex-col font-mono p-4 border border-current">
      <div className="text-sm font-semibold mb-2 opacity-100">{label}</div>
    </div>
  );
};

function KeypressLogDemo() {
  return (
    <div className="h-screen w-full flex">
      <div className="flex-1 p-4">
        <FocusableWithKeypressLog autoFocus={true} label="Focusable A" />
      </div>
      <div className="flex-1 p-4">
        <FocusableWithKeypressLog autoFocus={false} label="Focusable B" />
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
