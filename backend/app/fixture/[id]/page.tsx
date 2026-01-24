"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { FixtureDetailView } from "../../components/fixture-detail-view";
import { useLiveScore } from "../../../lib/useLiveScore";

export default function FixtureDetailPage() {
  const params = useParams();
  const fixtureId = typeof params?.id === "string" ? params.id : "";
  const { data, isLoading, error } = useLiveScore(20000, 23);
  const [dismissedWarning, setDismissedWarning] = useState(false);

  useEffect(() => {
    setDismissedWarning(false);
  }, [data?.warnings?.join("|")]);

  const fixture = useMemo(() => {
    return data?.matchups?.find((item) => item.id === fixtureId) ?? null;
  }, [data?.matchups, fixtureId]);

  const updatedAt = useMemo(() => {
    if (!data?.generatedAt) {
      return null;
    }
    return new Date(data.generatedAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }, [data?.generatedAt]);

  const warnings = dismissedWarning ? [] : data?.warnings ?? [];

  const banner =
    error || warnings.length > 0 ? (
      <div className="px-5 pt-4 space-y-2">
        {error && (
          <div className="text-xs" style={{ color: "var(--fpl-text-muted)" }}>
            Live update paused: {error}
          </div>
        )}
        {warnings.length > 0 && (
          <div
            className="text-xs flex items-center justify-between gap-3"
            style={{ color: "var(--fpl-text-muted)" }}
          >
            <span className="flex-1">{warnings[0]}</span>
            <button
              type="button"
              className="text-[10px] uppercase tracking-wide"
              style={{ color: "var(--fpl-text-primary)" }}
              onClick={() => setDismissedWarning(true)}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    ) : null;

  return (
    <FixtureDetailView
      fixture={fixture}
      gw={data?.gw ?? null}
      updatedAt={updatedAt}
      isLoading={isLoading}
      banner={banner}
    />
  );
}
