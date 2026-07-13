import { useEffect, useState } from 'react';

// A useState that mirrors its value to localStorage, so user choices (signed-up
// shifts, submitted requests) survive a page refresh without a sign-in flow.
export function usePersistentState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? (JSON.parse(stored) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Ignore quota / private-mode failures — persistence is best-effort.
    }
  }, [key, state]);

  return [state, setState] as const;
}
