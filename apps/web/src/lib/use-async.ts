"use client";

import { useCallback, useEffect, useState } from "react";

type AsyncState<T> = { data: T | null; error: string | null; loading: boolean };

/** Load data on mount and whenever `key` changes. `reload` fetches again. */
export function useAsync<T>(load: () => Promise<T>, key: string) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    loading: true,
  });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    load()
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch(
        (e: unknown) =>
          alive &&
          setState((prev) => ({
            data: prev.data,
            error: e instanceof Error ? e.message : "Something went wrong",
            loading: false,
          })),
      );
    return () => {
      alive = false;
    };
    // `load` is recreated every render; `key` says when the request changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { ...state, reload };
}
