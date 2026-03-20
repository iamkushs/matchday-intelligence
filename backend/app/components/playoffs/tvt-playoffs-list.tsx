"use client";

import Link from "next/link";
import { Skeleton } from "../ui/skeleton";
import { usePlayoffsScores } from "../../../lib/usePlayoffsScores";
import {
  buildAggregateSummary,
  buildPlayoffLegScores,
  getTvtPlayoffsFixtures
} from "../../../lib/playoffs";

export function TvtPlayoffsList() {
  const fixtures = getTvtPlayoffsFixtures();
  const { leg1, leg2, isLoading, error } = usePlayoffsScores();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--fpl-bg-deep)" }}>
      <div className="max-w-md mx-auto px-5 py-6">
        <header className="mb-6">
          <div
            className="text-xs uppercase tracking-[0.2em] mb-2"
            style={{ color: "var(--fpl-text-muted)" }}
          >
            TVT Playoffs
          </div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: "var(--fpl-text-primary)" }}
          >
            Round of 16
          </h1>
        </header>

        {error && (
          <div className="mb-4 text-xs" style={{ color: "var(--fpl-text-muted)" }}>
            Live update paused: {error}
          </div>
        )}

        <div className="space-y-4 pb-8">
          {isLoading && !leg1.data && !leg2.data
            ? Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-28 rounded-xl bg-white/5" />
              ))
            : fixtures.map((fixture) => {
                const legs = buildPlayoffLegScores(
                  fixture,
                  leg1.data,
                  leg2.data
                );
                const aggregate = buildAggregateSummary(legs);
                return (
                  <Link
                    key={fixture.fixtureId}
                    href={`/playoffs/tvt/${fixture.fixtureId}`}
                    className="block p-4 rounded-xl transition-all active:scale-[0.98]"
                    style={{
                      backgroundColor: "var(--fpl-bg-card)",
                      boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.05)"
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-sm font-semibold" style={{ color: "var(--fpl-text-primary)" }}>
                        {fixture.fixtureId}
                      </div>
                      <div className="text-[10px] uppercase" style={{ color: "var(--fpl-text-muted)" }}>
                        {fixture.round}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="text-sm font-semibold" style={{ color: "var(--fpl-text-primary)" }}>
                        {fixture.team1}
                      </div>
                      <span className="text-xs" style={{ color: "var(--fpl-text-muted)" }}>
                        vs
                      </span>
                      <div className="text-sm font-semibold" style={{ color: "var(--fpl-text-primary)" }}>
                        {fixture.team2}
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <span
                        className="text-lg font-bold tabular-nums"
                        style={{ color: "var(--fpl-team-a)" }}
                      >
                        {aggregate.aggregateTeam1Score ?? "--"}
                      </span>
                      <span className="text-xs" style={{ color: "var(--fpl-text-muted)" }}>
                        Aggregate
                      </span>
                      <span
                        className="text-lg font-bold tabular-nums"
                        style={{ color: "var(--fpl-team-b)" }}
                      >
                        {aggregate.aggregateTeam2Score ?? "--"}
                      </span>
                    </div>
                    <div className="text-[11px] text-center mt-2" style={{ color: "var(--fpl-text-muted)" }}>
                      {formatAggregateStatus(aggregate, fixture.team1, fixture.team2)}
                    </div>
                  </Link>
                );
              })}
        </div>
      </div>
    </div>
  );
}

function formatAggregateStatus(
  aggregate: ReturnType<typeof buildAggregateSummary>,
  team1: string,
  team2: string
) {
  switch (aggregate.winnerStatus) {
    case "decided":
      return aggregate.winner === "team1"
        ? `${team1} wins on aggregate`
        : `${team2} wins on aggregate`;
    case "tied":
      return "Tied on aggregate";
    case "live_aggregate":
      return aggregate.aggregateLeader === "team1"
        ? `${team1} leading on aggregate`
        : aggregate.aggregateLeader === "team2"
        ? `${team2} leading on aggregate`
        : "Tied on aggregate";
    case "leg1_complete":
      return aggregate.aggregateLeader === "team1"
        ? `${team1} leading after leg 1`
        : aggregate.aggregateLeader === "team2"
        ? `${team2} leading after leg 1`
        : "Tied after leg 1";
    default:
      return "Aggregate pending";
  }
}
