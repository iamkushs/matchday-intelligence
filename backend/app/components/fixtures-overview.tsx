import Link from "next/link";
import { Crown } from "lucide-react";
import type { ChallengeFixture, GameweekStatus, MatchupResponse } from "../../lib/types";
import { Skeleton } from "./ui/skeleton";
import { NotStartedAnimation } from "./not-started-animation";

type FixturesOverviewProps = {
  matchups: MatchupResponse[];
  challengeFixtures: ChallengeFixture[];
  gameweek: number;
  selectedGameweek: number;
  availableGameweeks: number[];
  gwStatus: GameweekStatus | null;
  updatedAt: string | null;
  isLoading: boolean;
  error: string | null;
  warnings: string[];
  onDismissWarnings?: () => void;
  onSelectGameweek: (gw: number) => void;
};

const teamColors = {
  home: "var(--fpl-team-a)",
  away: "var(--fpl-team-b)"
};

export function FixturesOverview({
  matchups,
  challengeFixtures,
  gameweek,
  selectedGameweek,
  availableGameweeks,
  gwStatus,
  updatedAt,
  isLoading,
  error,
  warnings,
  onDismissWarnings,
  onSelectGameweek
}: FixturesOverviewProps) {
  const visibleMatchups = matchups;
  const isFinished = gwStatus?.isFinished ?? false;
  const isNotStarted = gwStatus ? !gwStatus.isStarted && !gwStatus.isFinished : false;

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
            <div className="flex items-center gap-2">
              <div className="relative inline-flex items-center">
                <span
                  className="text-sm tracking-wide"
                  style={{ color: "var(--fpl-text-muted)" }}
                >
                  Gameweek {selectedGameweek}
                </span>
                <span className="ml-1 text-xs" style={{ color: "var(--fpl-text-muted)" }}>
                  ▾
                </span>
                <select
                  value={selectedGameweek}
                  onChange={(event) => onSelectGameweek(Number(event.target.value))}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                >
                  {availableGameweeks.map((gw) => (
                    <option key={gw} value={gw}>
                      {gw}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {updatedAt && (
              <div className="text-xs mt-1" style={{ color: "var(--fpl-text-muted)" }}>
                Updated {updatedAt}
              </div>
            )}
          </div>
        </header>

        {isNotStarted && (
          <div className="px-5 pb-2 text-center">
            <NotStartedAnimation className="w-full h-44 mb-1" />
            <div className="text-xs" style={{ color: "var(--fpl-text-muted)" }}>
              Gameweek {selectedGameweek} has not started yet. Check back later.
            </div>
          </div>
        )}

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

        {warnings.length > 0 && !isNotStarted && (
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
                <FixtureCard
                  key={matchup.id}
                  matchup={matchup}
                  isFinished={isFinished}
                  showCaptains={Boolean(gwStatus?.isCurrent || gwStatus?.isFinished)}
                />
              ))}
        </div>

        {challengeFixtures.length > 0 && (
          <div className="px-5 pb-10">
            <h2
              className="text-xs font-semibold tracking-wider uppercase mb-3"
              style={{ color: "var(--fpl-text-muted)" }}
            >
              Challenge Fixtures
            </h2>
            <div className="space-y-3">
              {challengeFixtures.map((fixture, index) => (
                <div
                  key={`${fixture.challengerTeamName}-${fixture.opponentTeamName}-${index}`}
                  className="p-4 rounded-xl"
                  style={{
                    backgroundColor: "var(--fpl-bg-card)",
                    boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.05)"
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-sm font-semibold" style={{ color: "var(--fpl-text-primary)" }}>
                      {fixture.challengerTeamName}
                    </div>
                    <div
                      className="text-[11px] uppercase tracking-wide"
                      style={{ color: "var(--fpl-text-muted)" }}
                    >
                      Challenge
                    </div>
                    <div className="text-sm font-semibold" style={{ color: "var(--fpl-text-primary)" }}>
                      {fixture.opponentTeamName}
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4 mb-2">
                    <span
                      className="text-2xl font-bold tabular-nums"
                      style={{ color: teamColors.home }}
                    >
                      {fixture.challengerTvtPoints}
                    </span>
                    <span className="text-lg" style={{ color: "var(--fpl-text-muted)" }}>
                      -
                    </span>
                    <span
                      className="text-2xl font-bold tabular-nums"
                      style={{ color: teamColors.away }}
                    >
                      {fixture.opponentTvtPoints}
                    </span>
                  </div>
                  <div className="text-xs text-center" style={{ color: "var(--fpl-text-muted)" }}>
                    Base points earned: {fixture.challengerBaseLeaguePoints}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type FixtureCardProps = {
  matchup: MatchupResponse;
  isFinished: boolean;
  showCaptains: boolean;
};

function FixtureCard({ matchup, isFinished, showCaptains }: FixtureCardProps) {
  const pointsDiff = matchup.home.totalPoints - matchup.away.totalPoints;
  const isLive = !isFinished;

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
          <div className="flex items-center gap-2">
            <h3
              className="text-base font-semibold tracking-tight"
              style={{ color: "var(--fpl-text-primary)" }}
            >
              {matchup.home.name}
            </h3>
            {matchup.homeChipType === "double_pointer" && (
              <span
                className="px-1.5 py-0.5 rounded-full text-[9px] uppercase"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  color: "var(--fpl-text-primary)"
                }}
              >
                D
              </span>
            )}
            {matchup.homeChipType === "win_win" && (
              <span
                className="px-1.5 py-0.5 rounded-full text-[9px] uppercase"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  color: "var(--fpl-text-primary)"
                }}
              >
                W
              </span>
            )}
          </div>
        </div>
        <div
          className={`px-2 py-0.5 rounded-md mx-3 ${
            isLive
              ? "bg-red-500/10 border border-red-500/30"
              : "bg-white/5 border border-white/10"
          }`}
        >
          <span
            className={`text-[9px] font-semibold tracking-wide uppercase ${
              isLive ? "text-red-400" : "text-[var(--fpl-text-muted)]"
            }`}
          >
            {isLive ? "LIVE" : "FINISHED"}
          </span>
        </div>
        <div className="flex-1 text-right">
          <div className="flex items-center justify-end gap-2">
            {matchup.awayChipType === "double_pointer" && (
              <span
                className="px-1.5 py-0.5 rounded-full text-[9px] uppercase"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  color: "var(--fpl-text-primary)"
                }}
              >
                D
              </span>
            )}
            {matchup.awayChipType === "win_win" && (
              <span
                className="px-1.5 py-0.5 rounded-full text-[9px] uppercase"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  color: "var(--fpl-text-primary)"
                }}
              >
                W
              </span>
            )}
            <h3
              className="text-base font-semibold tracking-tight"
              style={{ color: "var(--fpl-text-primary)" }}
            >
              {matchup.away.name}
            </h3>
          </div>
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

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div
            className="px-2.5 py-2 rounded-md"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              boxShadow: `0 0 0 1px ${teamColors.home}40`
            }}
          >
            <div className="flex items-center gap-1.5">
              <Crown size={10} style={{ color: teamColors.home, flexShrink: 0 }} />
              <span className="text-xs font-medium" style={{ color: "var(--fpl-text-primary)" }}>
                Captain
              </span>
            </div>
            <div
              className="text-[11px] font-semibold mt-1 truncate"
              style={{ color: teamColors.home }}
            >
              {getCaptainLabel(matchup.home.managers, showCaptains)}
            </div>
            <div className="h-px bg-white/5 my-2" />
            <div className="grid grid-cols-2 text-xs">
              <span style={{ color: "var(--fpl-text-muted)" }}>Players left</span>
              <span
                className="font-semibold tabular-nums text-left"
                style={{ color: "var(--fpl-text-primary)" }}
              >
                {matchup.home.playersLeftToPlay}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 text-right">
          <div
            className="px-2.5 py-2 rounded-md"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              boxShadow: `0 0 0 1px ${teamColors.away}40`
            }}
          >
            <div className="flex items-center gap-1.5 justify-end">
              <Crown size={10} style={{ color: teamColors.away, flexShrink: 0 }} />
              <span className="text-xs font-medium" style={{ color: "var(--fpl-text-primary)" }}>
                Captain
              </span>
            </div>
            <div
              className="text-[11px] font-semibold mt-1 truncate"
              style={{ color: teamColors.away }}
            >
              {getCaptainLabel(matchup.away.managers, showCaptains)}
            </div>
            <div className="h-px bg-white/5 my-2" />
            <div className="grid grid-cols-2 text-xs">
              <span style={{ color: "var(--fpl-text-muted)" }}>Players left</span>
              <span
                className="font-semibold tabular-nums text-right"
                style={{ color: "var(--fpl-text-primary)" }}
              >
                {matchup.away.playersLeftToPlay}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function getCaptainLabel(
  managers: MatchupResponse["home"]["managers"],
  showCaptains: boolean
) {
  if (!showCaptains) {
    return "TBA";
  }
  const captain = managers.find((manager) => manager.isCaptain);
  return captain?.managerName ?? "TBA";
}
