import {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
  useId,
  useMemo,
} from "react";
import { useHotkeys } from "../hooks/useHotkeys";
import { findClosestInDirection } from "../findClosestInDirection";

interface FocusContextValue {
  focusId: string;
  currentlyFocused: HTMLElement | null;
  setCurrentlyFocused: (element: HTMLElement | null) => void;
}

const FocusContext = createContext<FocusContextValue | null>(null);

interface FocusableProps {
  children: React.ReactNode;
}

const FocusableDebugSection = ({
  isFocused,
  elementTag,
}: {
  isFocused: boolean;
  elementTag: string;
}) => {
  return (
    <div
      className="text-xs opacity-60 mt-2 pt-2 border-t border-current"
      style={{ fontFamily: "monospace" }}
    >
      <div>Focusable Debug:</div>
      <div>isFocused: {isFocused ? "true" : "false"}</div>
      <div>element: {elementTag}</div>
    </div>
  );
};

export const Focusable = ({ children }: FocusableProps) => {
  const { ref, isFocused } = useFocus();
  const elementRef = useRef<HTMLDivElement>(null);
  const [elementTag, setElementTag] = useState<string>("DIV");

  useEffect(() => {
    ref(elementRef.current);
    if (elementRef.current) {
      setElementTag(elementRef.current.tagName);
    }
  }, [ref]);

  return (
    <div ref={elementRef} tabIndex={0}>
      {children}
      <FocusableDebugSection isFocused={isFocused} elementTag={elementTag} />
    </div>
  );
};

export const useFocus = () => {
  const context = useContext(FocusContext);
  const elementRef = useRef<HTMLElement | null>(null);

  const setRef = (element: HTMLElement | null) => {
    elementRef.current = element;
  };

  if (!context) {
    return {
      isFocused: false,
      focus: () => {},
      blur: () => {},
      ref: setRef,
    };
  }

  const { currentlyFocused, setCurrentlyFocused } = context;
  const isFocused = elementRef.current === currentlyFocused;

  return {
    isFocused,
    focus: () => {
      if (elementRef.current) {
        setCurrentlyFocused(elementRef.current);
        elementRef.current.focus();
      }
    },
    blur: () => {
      if (elementRef.current === currentlyFocused) {
        setCurrentlyFocused(null);
        elementRef.current?.blur();
      }
    },
    ref: setRef,
  };
};

export type DefaultFocusPosition =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center";

type FocusProviderProps = {
  children: React.ReactNode;
  defaultFocus?: DefaultFocusPosition;
};
export const FocusProvider = ({
  children,
  defaultFocus = "top-left",
}: FocusProviderProps) => {
  const hasFocus = useHasFocus();
  const focusId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentlyFocused, setCurrentlyFocused] = useState<HTMLElement | null>(
    null
  );

  const getFocusableElements = (): HTMLElement[] => {
    if (!containerRef.current) return [];
    const elements = containerRef.current.querySelectorAll<HTMLElement>(
      '[tabindex]:not([tabindex="-1"]), button, a, input, select, textarea'
    );
    return Array.from(elements);
  };

  useEffect(() => {
    const findDefaultFocusable = (): HTMLElement | null => {
      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return null;

      let closestElement: HTMLElement | null = null;
      let minDistance = Infinity;

      focusableElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const elementCenterX = rect.left + rect.width / 2;
        const elementCenterY = rect.top + rect.height / 2;
        const elementTop = rect.top;
        const elementBottom = rect.bottom;
        const elementLeft = rect.left;
        const elementRight = rect.right;

        let distance = Infinity;

        switch (defaultFocus) {
          case "center": {
            const viewportCenterX = window.innerWidth / 2;
            const viewportCenterY = window.innerHeight / 2;
            distance = Math.sqrt(
              Math.pow(elementCenterX - viewportCenterX, 2) +
                Math.pow(elementCenterY - viewportCenterY, 2)
            );
            break;
          }
          case "top": {
            distance = elementTop;
            break;
          }
          case "bottom": {
            distance = window.innerHeight - elementBottom;
            break;
          }
          case "left": {
            distance = elementLeft;
            break;
          }
          case "right": {
            distance = window.innerWidth - elementRight;
            break;
          }
          case "top-left": {
            distance = Math.sqrt(
              Math.pow(elementLeft, 2) + Math.pow(elementTop, 2)
            );
            break;
          }
          case "top-right": {
            distance = Math.sqrt(
              Math.pow(window.innerWidth - elementRight, 2) +
                Math.pow(elementTop, 2)
            );
            break;
          }
          case "bottom-left": {
            distance = Math.sqrt(
              Math.pow(elementLeft, 2) +
                Math.pow(window.innerHeight - elementBottom, 2)
            );
            break;
          }
          case "bottom-right": {
            distance = Math.sqrt(
              Math.pow(window.innerWidth - elementRight, 2) +
                Math.pow(window.innerHeight - elementBottom, 2)
            );
            break;
          }
        }

        if (distance < minDistance) {
          minDistance = distance;
          closestElement = element;
        }
      });

      return closestElement;
    };

    const defaultElement = findDefaultFocusable();
    if (defaultElement) {
      setCurrentlyFocused(defaultElement);
      defaultElement.focus();
    }
  }, [defaultFocus]);

  const navigateFocus = (
    direction: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight"
  ) => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const nextElement = findClosestInDirection(
      direction,
      currentlyFocused,
      focusableElements
    );

    if (nextElement) {
      setCurrentlyFocused(nextElement);
      nextElement.focus();
    }
  };

  useHotkeys([
    {
      key: "arrowup",
      description: "Arrow up",
      code: "ArrowUp",
      handler: () => {
        navigateFocus("ArrowUp");
      },
    },
    {
      key: "arrowdown",
      description: "Arrow down",
      code: "ArrowDown",
      handler: () => {
        navigateFocus("ArrowDown");
      },
    },
    {
      key: "arrowleft",
      description: "Arrow left",
      code: "ArrowLeft",
      handler: () => {
        navigateFocus("ArrowLeft");
      },
    },
    {
      key: "arrowright",
      description: "Arrow right",
      code: "ArrowRight",
      handler: () => {
        navigateFocus("ArrowRight");
      },
    },
  ]);

  const focusableElements = getFocusableElements();
  const currentlyFocusedInfo = useMemo(
    () =>
      currentlyFocused
        ? {
            tag: currentlyFocused.tagName,
            id: currentlyFocused.id || "(no id)",
            className: currentlyFocused.className || "(no class)",
          }
        : null,
    [currentlyFocused]
  );

  return (
    <FocusContext.Provider
      value={{
        focusId,
        currentlyFocused,
        setCurrentlyFocused,
      }}
    >
      <div ref={containerRef}>
        {children}
        <FocusProviderDebugSection
          focusId={focusId}
          hasFocus={hasFocus}
          defaultFocus={defaultFocus}
          focusableCount={focusableElements.length}
          currentlyFocusedInfo={currentlyFocusedInfo}
        />
      </div>
    </FocusContext.Provider>
  );
};

const FocusProviderDebugSection = ({
  focusId,
  hasFocus,
  defaultFocus,
  focusableCount,
  currentlyFocusedInfo,
}: {
  focusId: string;
  hasFocus: boolean;
  defaultFocus: DefaultFocusPosition;
  focusableCount: number;
  currentlyFocusedInfo: {
    tag: string;
    id: string;
    className: string;
  } | null;
}) => {
  return (
    <div
      className="text-xs opacity-60 mt-4 pt-2 border-t border-current"
      style={{ fontFamily: "monospace" }}
    >
      <div>FocusProvider Debug:</div>
      <div>focusId: {focusId}</div>
      <div>hasFocus: {hasFocus ? "true" : "false"}</div>
      <div>defaultFocus: {defaultFocus}</div>
      <div>focusableCount: {focusableCount}</div>
      <div>
        currentlyFocused:{" "}
        {currentlyFocusedInfo
          ? `${currentlyFocusedInfo.tag}${
              currentlyFocusedInfo.id !== "(no id)"
                ? `#${currentlyFocusedInfo.id}`
                : ""
            }${
              currentlyFocusedInfo.className !== "(no class)"
                ? `.${currentlyFocusedInfo.className.split(" ")[0]}`
                : ""
            }`
          : "null"}
      </div>
    </div>
  );
};

const useHasFocus = () => {
  // get the initial state
  const [focus, setFocus] = useState(document.hasFocus());

  useEffect(() => {
    // helper functions to update the status
    const onFocus = () => setFocus(true);
    const onBlur = () => setFocus(false);

    // assign the listener
    // update the status on the event
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);

    // remove the listener
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  // return the status
  return focus;
};
