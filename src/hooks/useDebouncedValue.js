import { useState, useEffect } from "react";

/**
 * Returns a debounced version of the given value.
 * The returned value only updates after `delay` ms of inactivity.
 *
 * @param {*} value - The value to debounce
 * @param {number} [delay=300] - Debounce delay in milliseconds
 * @returns {*} The debounced value
 */
export function useDebouncedValue(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
