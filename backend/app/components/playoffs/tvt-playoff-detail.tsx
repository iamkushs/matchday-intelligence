"use client";

import Link from "next/link";
import { usePlayoffsScores } from "../../../lib/usePlayoffsScores";
import {
  buildAggregateSummary,
  buildPlayoffLegScores,
  getTvtPlayoffFixture
} from "../../../lib/playoffs";
import { Skeleton } from "../ui/skeleton";

type TvtPlayoffDetailProps = {
  fixtureId: string;
};

export function TvtPlayoffDetail({ fixtureId }: TvtPlayoffDetailProps) {
  const fixture = getTvtPlayoffFixture(fixtureId);
  const { leg1, leg2, isLoading, error } = usePlayoffsScores();

  if (!fixture) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--fpl-bg-deep)" }}>
        <div className="max-w-md mx-auto px-5 py-10 text-center">
          <p className="text-sm" style={{ color: "var(--fpl-text-muted)" }}>
            Fixture not found.
          </p>
          <Link href="/playoffs/tvt" className="text-sm underline" style={{ color: "var(--fpl-text-primary)" }}>
            Back to TVT Playoffs
          </Link>
        </div>
      </div>
    );
  }

  const legs = buildPlayoffLegScores(fixture, leg1.data, leg2.data);
  const aggregate = buildAggregateSummary(legs);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--fpl-bg-deep)" }}>
      <div className="max-w-md mx-auto px-5 py-6">
        <header className="mb-6">
          <Link href="/playoffs/tvt" className="text-xs uppercase" style={{ color: "var(--fpl-text-muted)" }}>
            Back to TVT Playoffs
          </Link>
          <div className="mt-4">
            <div className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--fpl-text-muted)" }}>
              {fixture.round}
            </div>
            <h1 className="text-2xl font-semibold mt-2" style={{ color: "var(--fpl-text-primary)" }}>
              {fixture.team1} vs {fixture.team2}
            </h1>
            <div className="text-xs mt-1" style={{ color: "var(--fpl-text-muted)" }}>
              {fixture.fixtureId}
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-4 text-xs" style={{ color: "var(--fpl-text-muted)" }}>
            Live update paused: {error}
          </div>
        )}

        <div
          className="p-4 rounded-xl mb-6"
          style={{
            backgroundColor: "var(--fpl-bg-card)",
            boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.05)"
          }}
        >
          <div className="text-xs uppercase" style={{ color: "var(--fpl-text-muted)" }}>
            Aggregate
          </div>
          <div className="flex items-center justify-center gap-4 mt-3">
            <span className="text-3xl font-bold tabular-nums" style={{ color: "var(--fpl-team-a)" }}>
              {aggregate.aggregateTeam1Score ?? "--"}
            </span>
            <span className="text-base" style={{ color: "var(--fpl-text-muted)" }}>
              -
            </span>
            <span className="text-3xl font-bold tabular-nums" style={{ color: "var(--fpl-team-b)" }}>
              {aggregate.aggregateTeam2Score ?? "--"}
            </span>
          </div>
          <div className="text-xs text-center mt-2" style={{ color: "var(--fpl-text-muted)" }}>
            {formatAggregateStatus(aggregate, fixture.team1, fixture.team2)}
          </div>
        </div>

        <div className="space-y-4 pb-10">
          {isLoading && !leg1.data && !leg2.data ? (
            <>
              <Skeleton className="h-24 rounded-xl bg-white/5" />
              <Skeleton className="h-24 rounded-xl bg-white/5" />
            </>
          ) : (
            legs.map((legScore) => (
              <div
                key={legScore.leg}
                className="p-4 rounded-xl"
                style={{
                  backgroundColor: "var(--fpl-bg-card)",
                  boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.05)"
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold" style={{ color: "var(--fpl-text-primary)" }}>
                    GW{legScore.gw}
                  </div>
                  <div className="text-[11px] uppercase" style={{ color: "var(--fpl-text-muted)" }}>
                    Leg {legScore.leg}
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <span className="text-2xl font-bold tabular-nums" style={{ color: "var(--fpl-team-a)" }}>
                    {legScore.team1Score ?? "--"}
                  </span>
                  <span className="text-base" style={{ color: "var(--fpl-text-muted)" }}>
                    -
                  </span>
                  <span className="text-2xl font-bold tabular-nums" style={{ color: "var(--fpl-team-b)" }}>
                    {legScore.team2Score ?? "--"}
                  </span>
                </div>
                <div className="text-xs text-center mt-2" style={{ color: "var(--fpl-text-muted)" }}>
                  {formatLegStatus(legScore.status)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function formatLegStatus(status: string) {
  if (status === "finished") return "Finished";
  if (status === "live") return "Live";
  return "Upcoming";
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
