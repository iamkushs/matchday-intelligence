import Link from "next/link";
import { Crown, Filter } from "lucide-react";
import type { MatchupResponse } from "../../lib/types";
import { Skeleton } from "./ui/skeleton";

type FixturesOverviewProps = {
  matchups: MatchupResponse[];
  gameweek: number;
  updatedAt: string | null;
  isLoading: boolean;
  error: string | null;
  warnings: string[];
  onDismissWarnings?: () => void;
  filterMode: "all" | "live";
  onToggleFilter: () => void;
};

const teamColors = {
  home: "var(--fpl-team-a)",
  away: "var(--fpl-team-b)"
};

export function FixturesOverview({
  matchups,
  gameweek,
  updatedAt,
  isLoading,
  error,
  warnings,
  onDismissWarnings,
  filterMode,
  onToggleFilter
}: FixturesOverviewProps) {
  const liveMatches = matchups.length;
  const visibleMatchups = matchups;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--fpl-bg-deep)" }}>
      <div className="max-w-md mx-auto">
        <header className="px-5 py-6 flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-semibold tracking-tight mb-1"
              style={{ color: "var(--fpl-text-primary)" }}
            >
              Live Matches
            </h1>
            <div className="flex items-center gap-3">
              <span
                className="text-sm tracking-wide"
                style={{ color: "var(--fpl-text-muted)" }}
              >
                Gameweek {gameweek}
              </span>
              {liveMatches > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs" style={{ color: "var(--fpl-text-muted)" }}>
                    {liveMatches} live
                  </span>
                </div>
              )}
            </div>
            {updatedAt && (
              <div className="text-xs mt-1" style={{ color: "var(--fpl-text-muted)" }}>
                Updated {updatedAt}
              </div>
            )}
          </div>
          <button
            className="p-2.5 rounded-lg transition-colors hover:bg-white/5 flex items-center gap-2"
            style={{ color: "var(--fpl-text-muted)" }}
            type="button"
            onClick={onToggleFilter}
          >
            <Filter size={20} />
            <span className="text-xs uppercase tracking-wide">
              {filterMode === "live" ? "Live" : "All"}
            </span>
          </button>
        </header>

        {error && (
          <div className="px-5 pb-2">
            <div
              className="text-xs px-3 py-2 rounded-lg bg-white/5"
              style={{ color: "var(--fpl-text-muted)" }}
            >
              Live update paused: {error}
            </div>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="px-5 pb-2">
            <div
              className="text-xs px-3 py-2 rounded-lg bg-white/5 flex items-center justify-between gap-3"
              style={{ color: "var(--fpl-text-muted)" }}
            >
              <span className="flex-1">{warnings[0]}</span>
              {onDismissWarnings && (
                <button
                  type="button"
                  className="text-[10px] uppercase tracking-wide"
                  style={{ color: "var(--fpl-text-primary)" }}
                  onClick={onDismissWarnings}
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        )}

        <div className="px-5 pb-8 space-y-4">
          {isLoading && matchups.length === 0
            ? Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-32 rounded-xl bg-white/5" />
              ))
            : visibleMatchups.map((matchup) => (
                <FixtureCard key={matchup.id} matchup={matchup} />
              ))}
        </div>
      </div>
    </div>
  );
}

type FixtureCardProps = {
  matchup: MatchupResponse;
};

function FixtureCard({ matchup }: FixtureCardProps) {
  const pointsDiff = matchup.home.totalPoints - matchup.away.totalPoints;
  const isLive = true;

  return (
    <Link
      href={`/fixture/${matchup.id}`}
      className="block w-full p-5 rounded-xl transition-all active:scale-[0.98]"
      style={{
        backgroundColor: "var(--fpl-bg-card)",
        boxShadow: isLive ? "0 0 0 1px rgba(255, 255, 255, 0.05)" : "none"
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3
            className="text-base font-semibold tracking-tight"
            style={{ color: "var(--fpl-text-primary)" }}
          >
            {matchup.home.name}
          </h3>
        </div>
        {isLive && (
          <div className="px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/30 mx-3">
            <span className="text-red-400 text-[9px] font-semibold tracking-wide uppercase">
              LIVE
            </span>
          </div>
        )}
        <div className="flex-1 text-right">
          <h3
            className="text-base font-semibold tracking-tight"
            style={{ color: "var(--fpl-text-primary)" }}
          >
            {matchup.away.name}
          </h3>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mb-3">
        <span
          className={`text-4xl font-black tracking-tighter tabular-nums transition-all ${
            pointsDiff > 0 ? "opacity-100" : "opacity-60"
          }`}
          style={{
            color: teamColors.home,
            textShadow: pointsDiff > 0 && isLive ? `0 0 16px ${teamColors.home}30` : "none"
          }}
        >
          {matchup.home.totalPoints}
        </span>
        <span className="text-2xl font-light" style={{ color: "var(--fpl-text-muted)" }}>
          -
        </span>
        <span
          className={`text-4xl font-black tracking-tighter tabular-nums transition-all ${
            pointsDiff < 0 ? "opacity-100" : "opacity-60"
          }`}
          style={{
            color: teamColors.away,
            textShadow: pointsDiff < 0 && isLive ? `0 0 16px ${teamColors.away}30` : "none"
          }}
        >
          {matchup.away.totalPoints}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex-1 space-y-1.5">
          <div
            className="px-2.5 py-1.5 rounded-md flex items-center justify-between gap-2"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              boxShadow: `0 0 0 1px ${teamColors.home}40`
            }}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Crown size={10} style={{ color: teamColors.home, flexShrink: 0 }} />
              <span
                className="text-xs font-medium truncate"
                style={{ color: "var(--fpl-text-primary)" }}
              >
                Captain
              </span>
            </div>
            <span
              className="text-[11px] font-semibold truncate"
              style={{ color: teamColors.home, flexShrink: 0 }}
            >
              {getCaptainLabel(matchup.home.managers)}
            </span>
          </div>
          <div
            className="px-2.5 py-1.5 rounded-md flex items-center justify-between gap-2"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.02)" }}
          >
            <span className="text-xs font-medium" style={{ color: "var(--fpl-text-muted)" }}>
              Players left
            </span>
            <span
              className="text-xs font-semibold tabular-nums"
              style={{ color: "var(--fpl-text-primary)", flexShrink: 0 }}
            >
              {matchup.home.playersLeftToPlay}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-1.5">
          <div
            className="px-2.5 py-1.5 rounded-md flex items-center justify-between gap-2"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              boxShadow: `0 0 0 1px ${teamColors.away}40`
            }}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Crown size={10} style={{ color: teamColors.away, flexShrink: 0 }} />
              <span
                className="text-xs font-medium truncate"
                style={{ color: "var(--fpl-text-primary)" }}
              >
                Captain
              </span>
            </div>
            <span
              className="text-[11px] font-semibold truncate"
              style={{ color: teamColors.away, flexShrink: 0 }}
            >
              {getCaptainLabel(matchup.away.managers)}
            </span>
          </div>
          <div
            className="px-2.5 py-1.5 rounded-md flex items-center justify-between gap-2"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.02)" }}
          >
            <span className="text-xs font-medium" style={{ color: "var(--fpl-text-muted)" }}>
              Players left
            </span>
            <span
              className="text-xs font-semibold tabular-nums"
              style={{ color: "var(--fpl-text-primary)", flexShrink: 0 }}
            >
              {matchup.away.playersLeftToPlay}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function getCaptainLabel(managers: MatchupResponse["home"]["managers"]) {
  const captain = managers.find((manager) => manager.isCaptain);
  return captain?.managerName ?? "TBA";
}
