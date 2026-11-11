"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminPage } from "@/types/admin";

interface PageResult<T> {
  key: string;
  data: AdminPage<T> | null;
  error: string | null;
}

/**
 * Fetches one page of an admin list and re-fetches whenever `deps` change.
 * Loading is derived (the stored result belongs to an older request key), so no
 * state is set synchronously inside the effect, and stale responses are discarded.
 */
export function useAdminPage<T>(fetcher: () => Promise<AdminPage<T>>, deps: unknown[]) {
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState<PageResult<T>>({ key: "", data: null, error: null });

  const requestKey = `${JSON.stringify(deps)}#${reloadCount}`;

  useEffect(() => {
    let isActive = true;

    fetcher()
      .then((data) => {
        if (isActive) setResult({ key: requestKey, data, error: null });
      })
      .catch((err) => {
        if (isActive) {
          setResult({ key: requestKey, data: null, error: err instanceof Error ? err.message : "Request failed" });
        }
      });

    return () => {
      isActive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const retry = useCallback(() => setReloadCount((count) => count + 1), []);
  const isLoading = result.key !== requestKey;

  return {
    data: isLoading ? null : result.data,
    error: isLoading ? null : result.error,
    isLoading,
    retry,
  };
}
