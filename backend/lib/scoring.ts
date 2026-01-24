import type {
  ManagerResponse,
  ManagerStats,
  MatchupConfig,
  MatchupResponse
} from "./types";

type SideTotals = {
  captainEntryId: number | null;
  basePoints: number;
  captainBonus: number;
  totalPoints: number;
  playersLeftToPlay: number;
  managers: ManagerResponse[];
};

export function computeSideTotals(
  managers: number[],
  captainEntryId: number | null,
  managerStats: Map<number, ManagerStats>,
  managerMeta: Map<number, { managerName?: string; fplTeamName?: string }>,
  warnings: string[],
  matchupId: string,
  sideLabel: "home" | "away"
): SideTotals {
  const baseManagers = managers.map((entryId) => {
    const stats = managerStats.get(entryId);
    const meta = managerMeta.get(entryId);
    return {
      entryId,
      gwPoints: stats?.gwPoints ?? 0,
      playersLeftToPlay: stats?.playersLeftToPlay ?? 0,
      managerName: meta?.managerName,
      fplTeamName: meta?.fplTeamName
    };
  });

  const basePoints = baseManagers.reduce(
    (sum, manager) => sum + manager.gwPoints,
    0
  );
  const playersLeftToPlay = baseManagers.reduce(
    (sum, manager) => sum + manager.playersLeftToPlay,
    0
  );

  let captainBonus = 0;
  let resolvedCaptainId = captainEntryId ?? null;
  if (resolvedCaptainId && !managers.includes(resolvedCaptainId)) {
    warnings.push(
      `Captain entryId=${resolvedCaptainId} not in managers for matchup=${matchupId} (${sideLabel}), bonus set to 0.`
    );
    resolvedCaptainId = null;
  }

  if (!resolvedCaptainId && baseManagers.length > 0) {
    const lowest = baseManagers.reduce((min, current) =>
      current.gwPoints < min.gwPoints ? current : min
    );
    resolvedCaptainId = lowest.entryId;
  }

  const managerResponses: ManagerResponse[] = baseManagers.map((manager) => ({
    ...manager,
    isCaptain: manager.entryId === resolvedCaptainId
  }));

  if (resolvedCaptainId) {
    const captain = managerResponses.find(
      (manager) => manager.entryId === resolvedCaptainId
    );
    captainBonus = captain?.gwPoints ?? 0;
  }

  return {
    captainEntryId: resolvedCaptainId,
    basePoints,
    captainBonus,
    totalPoints: basePoints + captainBonus,
    playersLeftToPlay,
    managers: managerResponses
  };
}

export function computeMatchupTotals(
  matchup: MatchupConfig,
  captainConfig: { homeCaptain: number | null; awayCaptain: number | null },
  managerStats: Map<number, ManagerStats>,
  managerMeta: Map<number, { managerName?: string; fplTeamName?: string }>,
  warnings: string[]
): MatchupResponse {
  const homeTotals = computeSideTotals(
    matchup.home.managers,
    captainConfig.homeCaptain,
    managerStats,
    managerMeta,
    warnings,
    matchup.id,
    "home"
  );
  const awayTotals = computeSideTotals(
    matchup.away.managers,
    captainConfig.awayCaptain,
    managerStats,
    managerMeta,
    warnings,
    matchup.id,
    "away"
  );

  return {
    id: matchup.id,
    home: {
      name: matchup.home.name,
      ...homeTotals
    },
    away: {
      name: matchup.away.name,
      ...awayTotals
    }
  };
}
