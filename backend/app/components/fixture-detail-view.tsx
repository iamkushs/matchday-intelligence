import Link from "next/link";
import { ArrowLeft, Crown } from "lucide-react";
import type { MatchupResponse } from "../../lib/types";
import { stadiumImages } from "../../lib/stadiumImages";
import { Skeleton } from "./ui/skeleton";

type FixtureDetailViewProps = {
  fixture: MatchupResponse | null;
  gw: number | null;
  updatedAt: string | null;
  isLoading: boolean;
  banner?: React.ReactNode;
};

const teamColors = {
  home: "var(--fpl-team-a)",
  away: "var(--fpl-team-b)"
};

export function FixtureDetailView({
  fixture,
  gw,
  updatedAt,
  isLoading,
  banner
}: FixtureDetailViewProps) {
  if (isLoading && !fixture) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--fpl-bg-deep)" }}>
        <div className="max-w-md mx-auto px-5 py-6 space-y-4">
          <Skeleton className="h-6 w-28 bg-white/5" />
          <Skeleton className="h-32 rounded-xl bg-white/5" />
          <Skeleton className="h-24 rounded-xl bg-white/5" />
        </div>
      </div>
    );
  }

  if (!fixture) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--fpl-bg-deep)" }}>
        <div className="max-w-md mx-auto px-5 py-10 text-center">
          <p className="text-sm mb-4" style={{ color: "var(--fpl-text-muted)" }}>
            Fixture not found.
          </p>
          <Link
            href="/"
            className="text-sm underline"
            style={{ color: "var(--fpl-text-primary)" }}
          >
            Back to gameweek
          </Link>
        </div>
      </div>
    );
  }

  const pointsDiff = fixture.home.totalPoints - fixture.away.totalPoints;
  const leader =
    pointsDiff > 0 ? fixture.home.name : pointsDiff < 0 ? fixture.away.name : "Tie";
  const stadiumImage = getStadiumImage(fixture.id, gw, stadiumImages);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--fpl-bg-deep)" }}>
      <div className="max-w-md mx-auto">
        {banner}
        <header className="px-5 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="p-2 -ml-2 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: "var(--fpl-text-muted)" }}
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="text-center">
            <div
              className="text-[11px] uppercase tracking-wider font-medium"
              style={{ color: "var(--fpl-text-muted)" }}
            >
              GW {gw ?? "-"}
            </div>
            {updatedAt && (
              <div className="text-[10px]" style={{ color: "var(--fpl-text-muted)" }}>
                Updated {updatedAt}
              </div>
            )}
          </div>
          <div className="w-12" />
        </header>

        <section className="px-5 py-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1
                className="text-xl font-semibold tracking-tight"
                style={{ color: "var(--fpl-text-primary)" }}
              >
                {fixture.home.name}
              </h1>
            </div>
            <div className="flex-1 text-right">
              <h1
                className="text-xl font-semibold tracking-tight"
                style={{ color: "var(--fpl-text-primary)" }}
              >
                {fixture.away.name}
              </h1>
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-6">
              <span
                className="text-6xl font-black tracking-tighter tabular-nums fpl-live-glow"
                style={{
                  color: teamColors.home,
                  textShadow: `0 0 24px ${teamColors.home}40`
                }}
              >
                {fixture.home.totalPoints}
              </span>
              <span
                className="text-3xl font-light"
                style={{ color: "var(--fpl-text-muted)" }}
              >
                -
              </span>
              <span
                className="text-6xl font-black tracking-tighter tabular-nums fpl-live-glow"
                style={{
                  color: teamColors.away,
                  textShadow: `0 0 24px ${teamColors.away}40`
                }}
              >
                {fixture.away.totalPoints}
              </span>
            </div>
          </div>

          {stadiumImage && (
            <div className="flex justify-center mb-4">
              <div className="w-full max-w-sm h-[198px] overflow-hidden">
                <img
                  src={stadiumImage}
                  alt="Stadium"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          <div className="text-center">
            <p className="text-sm" style={{ color: "var(--fpl-text-muted)" }}>
              {leader} {pointsDiff === 0 ? "level" : "leads"}{" "}
              {pointsDiff !== 0 && (
                <>
                  by{" "}
                  <span
                    className="font-semibold"
                    style={{
                      color: pointsDiff > 0 ? teamColors.home : teamColors.away
                    }}
                  >
                    {Math.abs(pointsDiff)} pts
                  </span>
                </>
              )}
            </p>
          </div>
        </section>

        <div className="px-5">
          <div className="h-px bg-white/5 mb-6" />
        </div>

        <section className="px-5 pb-8">
          <h2
            className="text-xs font-semibold tracking-wider uppercase mb-4"
            style={{ color: "var(--fpl-text-muted)" }}
          >
            Breakdown
          </h2>

          <div className="space-y-4">
            <TeamBreakdown
              label="Home"
              side={fixture.home}
              accentColor={teamColors.home}
              align="left"
            />
            <TeamBreakdown
              label="Away"
              side={fixture.away}
              accentColor={teamColors.away}
              align="right"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

type TeamBreakdownProps = {
  label: string;
  side: MatchupResponse["home"];
  accentColor: string;
  align: "left" | "right";
};

function TeamBreakdown({ label, side, accentColor, align }: TeamBreakdownProps) {
  const captainName =
    side.managers.find((manager) => manager.isCaptain)?.managerName ?? "TBA";
  const isRight = align === "right";
  return (
    <div
      className="p-4 rounded-lg"
      style={{
        backgroundColor: "var(--fpl-bg-card)",
        boxShadow: `0 0 0 1px ${accentColor}40`
      }}
    >
      <div className={`flex items-center justify-between mb-3 ${isRight ? "text-right" : ""}`}>
        <div className="text-sm font-semibold" style={{ color: accentColor }}>
          {label}
        </div>
        <div className="text-xs" style={{ color: "var(--fpl-text-muted)" }}>
          Total {side.totalPoints}
        </div>
      </div>

      <div className="text-xs" style={{ color: "var(--fpl-text-muted)" }}>
        Captain
      </div>
      <div
        className="text-sm font-semibold mt-1 truncate"
        style={{ color: "var(--fpl-text-primary)" }}
      >
        {captainName}
      </div>
      <div className="h-px bg-white/5 my-3" />
      <div className="grid grid-cols-2 text-xs mb-4">
        <span style={{ color: "var(--fpl-text-muted)" }}>Players left</span>
        <span
          className={`font-semibold tabular-nums ${isRight ? "text-right" : "text-left"}`}
          style={{ color: "var(--fpl-text-primary)" }}
        >
          {side.playersLeftToPlay}
        </span>
      </div>

      <div className="space-y-2">
        {side.managers.map((manager, index) => (
          <ManagerRow
            key={manager.entryId}
            manager={manager}
            label={`Manager ${index + 1}`}
            accentColor={accentColor}
          />
        ))}
      </div>
    </div>
  );
}

type ManagerRowProps = {
  manager: MatchupResponse["home"]["managers"][number];
  label: string;
  accentColor: string;
};

function ManagerRow({ manager, label, accentColor }: ManagerRowProps) {
  const displayName = manager.managerName ?? label;
  return (
    <div
      className="px-3 py-2 rounded-md flex items-center justify-between gap-3"
      style={{ backgroundColor: "rgba(255, 255, 255, 0.02)" }}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {manager.isCaptain && (
            <Crown size={12} style={{ color: accentColor, flexShrink: 0 }} />
          )}
          <span
            className="text-sm font-medium truncate"
            style={{ color: "var(--fpl-text-primary)" }}
          >
            {displayName}
          </span>
        </div>
      </div>
      <div className="text-right">
        <div
          className="text-sm font-semibold tabular-nums"
          style={{ color: "var(--fpl-text-primary)" }}
        >
          {manager.gwPoints} pts
        </div>
        <div className="text-[11px]" style={{ color: "var(--fpl-text-muted)" }}>
          {manager.playersLeftToPlay} left
        </div>
      </div>
    </div>
  );
}

function getStadiumImage(
  fixtureId: string,
  gw: number | null,
  images: readonly string[]
) {
  if (!images.length || !gw) {
    return null;
  }
  const seed = `${gw}-${fixtureId}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 2147483647;
  }
  const index = Math.abs(hash) % images.length;
  return `/Assets/${images[index]}`;
}
