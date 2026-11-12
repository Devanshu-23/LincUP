import { useCallback, useEffect, useState } from "react";

// Load data from the API and track loading / error state.
//
//   const { data, loading, error, reload, setData } =
//     useApi(() => api.getCommunity(id), [id]);
//
// - `loading` is true until the first response for the current `deps`.
// - `reload()` refetches silently (old data stays on screen meanwhile).
// - `setData` lets a page update the data optimistically.
export default function useApi(fetcher, deps = []) {
  const depsKey = JSON.stringify(deps);
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState({ data: null, error: null, depsKey: null });

  useEffect(() => {
    let cancelled = false;
    fetcher()
      .then((data) => !cancelled && setState({ data, error: null, depsKey }))
      .catch((error) => !cancelled && setState({ data: null, error, depsKey }));
    return () => {
      cancelled = true;
    };
    // fetcher is re-created every render; depsKey + nonce decide when to refetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const setData = useCallback(
    (updater) =>
      setState((s) => ({
        ...s,
        data: typeof updater === "function" ? updater(s.data) : updater,
      })),
    [],
  );

  return {
    data: state.data,
    error: state.error,
    loading: state.depsKey !== depsKey,
    reload,
    setData,
  };
}
