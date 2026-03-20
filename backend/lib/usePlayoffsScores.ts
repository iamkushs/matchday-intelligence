import { useLiveScore } from "./useLiveScore";

export function usePlayoffsScores(pollIntervalMs = 20000) {
  const leg1 = useLiveScore(pollIntervalMs, 31);
  const leg2 = useLiveScore(pollIntervalMs, 32);

  return {
    leg1,
    leg2,
    isLoading: leg1.isLoading && leg2.isLoading,
    error: leg1.error ?? leg2.error
  };
}
