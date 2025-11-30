import { useEffect, useState, useRef } from "react";

/**
 * Hook that debounces a value with trailing edge behavior.
 * The debounced value updates after the specified delay period ends, only if
 * no new values are provided during that period.
 *
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 300)
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedQuery = useDebouncedTrailingHook(searchQuery, 500);
 *
 * // When searchQuery changes rapidly, debouncedQuery will only update
 * // 500ms after the last change
 * ```
 */
export function useDebouncedTrailingHook<T>(
  value: T,
  delay: number = 300
): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set a new timeout to update the debounced value after the delay
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup timeout on unmount or when value/delay changes
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

