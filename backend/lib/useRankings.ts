import { useCallback, useEffect, useRef, useState } from "react";
import type { RankingsApiResponse } from "./types";

type RankingsState = {
  data: RankingsApiResponse | null;
  isLoading: boolean;
  error: string | null;
  refreshNow: () => void;
};

export function useRankings(gw: number | null, pollIntervalMs = 20000): RankingsState {
  const [data, setData] = useState<RankingsApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchRankings = useCallback(async () => {
    if (!gw) {
      return;
    }
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return;
    }
    try {
      const response = await fetch(`/api/rankings?gw=${gw}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }
      const payload = (await response.json()) as RankingsApiResponse;
      if (!isMounted.current) {
        return;
      }
      setData(payload);
      setError(null);
    } catch (err) {
      if (!isMounted.current) {
        return;
      }
      const message =
        err instanceof Error ? err.message : "Unable to fetch standings.";
      setError(message);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [gw]);

  useEffect(() => {
    isMounted.current = true;
    setIsLoading(true);
    fetchRankings();

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(fetchRankings, pollIntervalMs);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchRankings();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      isMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchRankings, pollIntervalMs]);

  return {
    data,
    isLoading,
    error,
    refreshNow: fetchRankings
  };
}
