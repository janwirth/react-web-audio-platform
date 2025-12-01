import { useState, useEffect, useRef } from "react";
import { useHotkeys } from "../hooks/useHotkeys";
import { findClosestInDirection } from "../findClosestInDirection";

interface FocusableProps {
  children: React.ReactNode;
}

export const Focusable = ({ children }: FocusableProps) => {
  return <div tabIndex={0}>{children}</div>;
};

export const useFocus = () => {
  return {
    isFocused: false,
    focus: () => {},
    blur: () => {},
  };
};
type FocusProviderProps = {
  children: React.ReactNode;
};
export const FocusProvider = ({ children }: FocusProviderProps) => {
  const hasFocus = useHasFocus();
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
    const findCentermostFocusable = (): HTMLElement | null => {
      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return null;

      const viewportCenterX = window.innerWidth / 2;
      const viewportCenterY = window.innerHeight / 2;

      let closestElement: HTMLElement | null = null;
      let minDistance = Infinity;

      focusableElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const elementCenterX = rect.left + rect.width / 2;
        const elementCenterY = rect.top + rect.height / 2;

        const distance = Math.sqrt(
          Math.pow(elementCenterX - viewportCenterX, 2) +
            Math.pow(elementCenterY - viewportCenterY, 2)
        );

        if (distance < minDistance) {
          minDistance = distance;
          closestElement = element;
        }
      });

      return closestElement;
    };

    const centermostElement = findCentermostFocusable();
    if (centermostElement) {
      setCurrentlyFocused(centermostElement);
      centermostElement.focus();
    }
  }, []);

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

  console.log(hasFocus);
  const hotkeys = useHotkeys([
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
  return <div ref={containerRef}>{children}</div>;
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
