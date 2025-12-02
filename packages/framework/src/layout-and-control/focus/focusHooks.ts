import { useState, useEffect } from "react";
import { findClosestInDirection } from "../findClosestInDirection";

export const focusElementTo = (
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

export const useIsFocused = (ref: React.RefObject<HTMLElement | null>) => {
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

export const useKeydownIfFocussed = (
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

export const useHasFocus = () => {
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
