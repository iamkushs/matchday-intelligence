"use client";

import { useEffect, useMemo, useState } from "react";
import { FixturesOverview } from "./components/fixtures-overview";
import { useLiveScore } from "../lib/useLiveScore";

export default function HomePage() {
  const { data, isLoading, error } = useLiveScore(20000, 23);
  const [dismissedWarning, setDismissedWarning] = useState(false);
  const [filterMode, setFilterMode] = useState<"all" | "live">("all");

  const matchups = data?.matchups ?? [];
  const gameweek = data?.gw ?? 0;
  const warnings = dismissedWarning ? [] : data?.warnings ?? [];

  useEffect(() => {
    setDismissedWarning(false);
  }, [data?.warnings?.join("|")]);

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
      updatedAt={updatedAt}
      isLoading={isLoading}
      error={error}
      warnings={warnings}
      onDismissWarnings={() => setDismissedWarning(true)}
      filterMode={filterMode}
      onToggleFilter={() =>
        setFilterMode((current) => (current === "all" ? "live" : "all"))
      }
    />
  );
}
