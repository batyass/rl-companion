import { useEffect, useState } from "react";

// A single shared clock so every countdown chip in the grid can re-render on
// the same tick without each one spinning up its own setInterval. All
// subscribers share one interval; it starts on the first subscriber and stops
// when the last one unmounts.
let listeners = new Set();
let timer = null;
let current = typeof Date !== "undefined" ? Date.now() : 0;

function tick() {
  current = Date.now();
  listeners.forEach((fn) => fn(current));
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(current);

  useEffect(() => {
    listeners.add(setNow);
    if (timer === null) timer = setInterval(tick, intervalMs);
    return () => {
      listeners.delete(setNow);
      if (listeners.size === 0 && timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };
  }, [intervalMs]);

  return now;
}
