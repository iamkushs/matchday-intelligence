"use client";

import { useEffect, useMemo, useState } from "react";
import { FixturesOverview } from "./components/fixtures-overview";
import { useLiveScore } from "../lib/useLiveScore";

export default function HomePage() {
  const [selectedGameweek, setSelectedGameweek] = useState<number | null>(null);
  const { data, isLoading, error } = useLiveScore(20000, selectedGameweek);
  const [dismissedWarning, setDismissedWarning] = useState(false);

  const matchups = data?.matchups ?? [];
  const gameweek = data?.gw ?? 0;
  const warnings = dismissedWarning ? [] : data?.warnings ?? [];
  const gwStatus = data?.gwStatus ?? null;

  useEffect(() => {
    setDismissedWarning(false);
  }, [data?.warnings?.join("|")]);

  useEffect(() => {
    if (selectedGameweek === null && data?.gw) {
      setSelectedGameweek(data.gw);
    }
  }, [data?.gw, selectedGameweek]);

  const availableGameweeks = useMemo(() => {
    const weeks: number[] = [];
    for (let gw = 23; gw <= 38; gw += 1) {
      weeks.push(gw);
    }
    return weeks;
  }, []);

  const updatedAt = useMemo(() => {
    if (!data?.generatedAt) {
      return null;
    }
    return new Date(data.generatedAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }, [data?.generatedAt]);

  return (
    <FixturesOverview
      matchups={matchups}
      gameweek={gameweek}
      selectedGameweek={selectedGameweek ?? gameweek}
      availableGameweeks={availableGameweeks}
      gwStatus={gwStatus}
      updatedAt={updatedAt}
      isLoading={isLoading}
      error={error}
      warnings={warnings}
      onDismissWarnings={() => setDismissedWarning(true)}
      onSelectGameweek={(gw) => setSelectedGameweek(gw)}
    />
  );
}
