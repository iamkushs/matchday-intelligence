import { useCallback, useEffect, useRef, useState } from "react";
import type { LiveScoreApiResponse } from "./types";

type LiveScoreState = {
  data: LiveScoreApiResponse | null;
  isLoading: boolean;
  error: string | null;
  refreshNow: () => void;
};

export function useLiveScore(
  pollIntervalMs = 20000,
  gwOverride?: number | null
): LiveScoreState {
  const [data, setData] = useState<LiveScoreApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const fetchLiveScore = useCallback(async () => {
    try {
      const url =
        typeof gwOverride === "number"
          ? `/api/live-score?gw=${gwOverride}`
          : "/api/live-score";
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }
      const payload = (await response.json()) as LiveScoreApiResponse;
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
        err instanceof Error ? err.message : "Unable to fetch live score.";
      setError(message);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [gwOverride]);

  useEffect(() => {
    isMounted.current = true;
    fetchLiveScore();
    const intervalId = setInterval(fetchLiveScore, pollIntervalMs);
    return () => {
      isMounted.current = false;
      clearInterval(intervalId);
    };
  }, [fetchLiveScore, pollIntervalMs]);

  return {
    data,
    isLoading,
    error,
    refreshNow: fetchLiveScore
  };
}
