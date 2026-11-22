import { useCallback, useSyncExternalStore } from "react";

// true while the CSS media query matches, e.g. useMediaQuery("(max-width: 720px)")
export default function useMediaQuery(query) {
  const subscribe = useCallback(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
}
