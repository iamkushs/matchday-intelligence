import path from "path";
import { promises as fs } from "fs";
import type { LiveScoreApiResponse, MatchupResponse } from "./types";

export type StandingRow = {
  team_name: string;
  group: "A" | "B";
  rank: number;
  mp: number;
  w: number;
  d: number;
  l: number;
  cp_bp: number;
  points: number;
  overall_scores: number;
  qualifying_for: string;
  baseline_gw: number;
};

export type GroupStandings = StandingRow[];

export type SourceSummary = {
  gw: number;
  source: "live" | "archived";
  archivedStatus: "finished" | "live" | null;
};

export type RankedResponseGroupRow = Omit<StandingRow, "group" | "baseline_gw"> & {
  team_name: string;
  qualifying_for: string;
};

const TEAM_NAME_ALIASES: Record<string, string> = {
  "Despicable Memelennials": "Despicable Memelenials",
  "North Eastern Hillbillies": "North Eastern Hillibillies",
  "xG Xorcists": "XX Orcsits",
  "Maresca's Villagers": "Maresca’s Villagers"
};

export function normalizeTeamName(name: string) {
  return TEAM_NAME_ALIASES[name] ?? name;
}

export async function loadBaselineStandings(
  fileName: string
): Promise<GroupStandings> {
  const fullPath = path.join(process.cwd(), "data", fileName);
  const content = await fs.readFile(fullPath, "utf8");
  return JSON.parse(content) as GroupStandings;
}

export function buildGroupIndex(
  groupA: GroupStandings,
  groupB: GroupStandings
) {
  const map = new Map<string, "A" | "B">();
  for (const row of groupA) {
    map.set(row.team_name, "A");
  }
  for (const row of groupB) {
    map.set(row.team_name, "B");
  }
  return map;
}

export function cloneStandings(
  rows: GroupStandings
): Map<string, StandingRow> {
  const map = new Map<string, StandingRow>();
  for (const row of rows) {
    map.set(row.team_name, { ...row });
  }
  return map;
}

export function getMatchupTvtPoints(matchup: MatchupResponse) {
  const homePoints = matchup.home?.totalPoints ?? 0;
  const awayPoints = matchup.away?.totalPoints ?? 0;
  return { homePoints, awayPoints };
}

export function getLeaguePointsFromMatchup(matchup: MatchupResponse) {
  const homeFinal =
    typeof matchup.homeFinalLeaguePoints === "number"
      ? matchup.homeFinalLeaguePoints
      : null;
  const awayFinal =
    typeof matchup.awayFinalLeaguePoints === "number"
      ? matchup.awayFinalLeaguePoints
      : null;

  if (homeFinal !== null && awayFinal !== null) {
    return { homeLeague: homeFinal, awayLeague: awayFinal };
  }

  const { homePoints, awayPoints } = getMatchupTvtPoints(matchup);
  if (homePoints > awayPoints) {
    return { homeLeague: 2, awayLeague: 0 };
  }
  if (homePoints < awayPoints) {
    return { homeLeague: 0, awayLeague: 2 };
  }
  return { homeLeague: 1, awayLeague: 1 };
}

export function isArchivedFinished(payload: LiveScoreApiResponse | null) {
  if (!payload) {
    return false;
  }
  const gwStatus = payload.gwStatus as any;
  if (typeof gwStatus === "string") {
    return gwStatus === "finished";
  }
  if (gwStatus && typeof gwStatus.isFinished === "boolean") {
    return gwStatus.isFinished;
  }
  return false;
}

export function applyMatchupDelta(
  matchup: MatchupResponse,
  standingsA: Map<string, StandingRow>,
  standingsB: Map<string, StandingRow>,
  groupIndex: Map<string, "A" | "B">,
  warnings: string[]
) {
  const rawHomeName = matchup.home?.name;
  const rawAwayName = matchup.away?.name;
  if (!rawHomeName || !rawAwayName) {
    return;
  }
  const homeName = normalizeTeamName(rawHomeName);
  const awayName = normalizeTeamName(rawAwayName);

  const homeGroup = groupIndex.get(homeName);
  const awayGroup = groupIndex.get(awayName);
  if (!homeGroup || !awayGroup) {
    if (!homeGroup) {
      warnings.push(`Team not found in baseline: ${rawHomeName}`);
    }
    if (!awayGroup) {
      warnings.push(`Team not found in baseline: ${rawAwayName}`);
    }
    return;
  }

  const homeRow = homeGroup === "A" ? standingsA.get(homeName) : standingsB.get(homeName);
  const awayRow = awayGroup === "A" ? standingsA.get(awayName) : standingsB.get(awayName);
  if (!homeRow || !awayRow) {
    return;
  }

  const { homePoints, awayPoints } = getMatchupTvtPoints(matchup);
  if (homePoints > awayPoints) {
    homeRow.w += 1;
    awayRow.l += 1;
  } else if (homePoints < awayPoints) {
    homeRow.l += 1;
    awayRow.w += 1;
  } else {
    homeRow.d += 1;
    awayRow.d += 1;
  }

  const { homeLeague, awayLeague } = getLeaguePointsFromMatchup(matchup);
  homeRow.points += homeLeague;
  awayRow.points += awayLeague;

  homeRow.overall_scores += homePoints;
  awayRow.overall_scores += awayPoints;
}

export function incrementMatchesPlayed(
  standingsA: Map<string, StandingRow>,
  standingsB: Map<string, StandingRow>
) {
  for (const row of standingsA.values()) {
    row.mp += 1;
  }
  for (const row of standingsB.values()) {
    row.mp += 1;
  }
}

export function sortAndRank(rows: Map<string, StandingRow>) {
  const list = Array.from(rows.values());
  list.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.w !== a.w) return b.w - a.w;
    if (b.cp_bp !== a.cp_bp) return b.cp_bp - a.cp_bp;
    if (b.overall_scores !== a.overall_scores) return b.overall_scores - a.overall_scores;
    return a.team_name.localeCompare(b.team_name);
  });

  list.forEach((row, index) => {
    row.rank = index + 1;
    if (row.rank <= 8) {
      row.qualifying_for = "TVT Playoffs";
    } else if (row.rank <= 14) {
      row.qualifying_for = "Challenger’s Playoffs";
    } else {
      row.qualifying_for = "Elimination Zone";
    }
  });

  return list;
}

export function buildRankedResponse(rows: StandingRow[]): RankedResponseGroupRow[] {
  return rows.map((row) => ({
    team_name: row.team_name,
    rank: row.rank,
    mp: row.mp,
    w: row.w,
    d: row.d,
    l: row.l,
    cp_bp: row.cp_bp,
    points: row.points,
    overall_scores: row.overall_scores,
    qualifying_for: row.qualifying_for
  }));
}
