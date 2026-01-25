import { NextResponse } from "next/server";
import matchupsData from "../../../data/matchups.json";
import captainsData from "../../../data/captains.json";
import teamsData from "../../../data/teams.json";
import path from "path";
import { promises as fs } from "fs";
import {
  buildElementToTeamMap,
  buildElementPointsMap,
  buildTeamHasUnstartedMap,
  getBootstrapStatic,
  getCurrentGameweek,
  getEntryEventPicks,
  getEventLiveForGw,
  getEplFixturesForGw
} from "../../../lib/fpl";
import type {
  CaptainsFile,
  EntryEventPicks,
  GameweekStatus,
  LiveScoreApiResponse,
  ManagerStats,
  MatchupConfig,
  MatchupsFile,
  TeamsFile
} from "../../../lib/types";
import { computeMatchupTotals } from "../../../lib/scoring";

const CACHE_CONTROL_VALUE = "s-maxage=10, stale-while-revalidate=30";

function getUniqueEntryIds(matchups: MatchupConfig[]) {
  const ids = new Set<number>();
  for (const matchup of matchups) {
    for (const entryId of matchup.home.managers) {
      ids.add(entryId);
    }
    for (const entryId of matchup.away.managers) {
      ids.add(entryId);
    }
  }
  return Array.from(ids);
}

function resolveCaptainConfig(
  captains: CaptainsFile | null,
  gw: number,
  matchupId: string,
  warnings: string[]
) {
  const gwKey = String(gw);
  const override = captains?.byGameweek?.[gwKey]?.[matchupId];
  const fallback = captains?.default?.[matchupId];
  const config = override ?? fallback ?? null;
  if (!config) {
    warnings.push(
      `Missing captain config for matchup=${matchupId} (gw=${gw}), bonus set to 0.`
    );
  }
  return {
    homeCaptain: config?.homeCaptain ?? null,
    awayCaptain: config?.awayCaptain ?? null
  };
}

function getGwPointsFromPicks(picksData: EntryEventPicks | null) {
  const points = picksData?.entry_history?.points;
  return typeof points === "number" ? points : 0;
}

async function readResultsFile(gw: number) {
  try {
    const fullPath = path.join(process.cwd(), "data", "results", `gw-${gw}.json`);
    const data = await fs.readFile(fullPath, "utf8");
    return JSON.parse(data) as LiveScoreApiResponse;
  } catch {
    return null;
  }
}

async function writeResultsFile(gw: number, payload: LiveScoreApiResponse) {
  try {
    const dirPath = path.join(process.cwd(), "data", "results");
    await fs.mkdir(dirPath, { recursive: true });
    const fullPath = path.join(dirPath, `gw-${gw}.json`);
    await fs.writeFile(fullPath, JSON.stringify(payload, null, 2), "utf8");
    return true;
  } catch {
    return false;
  }
}

function buildGwStatus(bootstrap: any, gw: number): GameweekStatus | null {
  const events = bootstrap?.events;
  if (!Array.isArray(events)) {
    return null;
  }
  const event = events.find((item: any) => item?.id === gw);
  if (!event) {
    return null;
  }
  return {
    id: gw,
    name: event?.name,
    isCurrent: Boolean(event?.is_current),
    isNext: Boolean(event?.is_next),
    isFinished: Boolean(event?.finished),
    isStarted: Boolean(event?.is_current || event?.is_previous || event?.finished)
  };
}

export async function GET(request: Request) {
  const warnings: string[] = [];
  const url = new URL(request.url);
  const gwParam = url.searchParams.get("gw");
  const matchupId = url.searchParams.get("matchupId");

  const bootstrap = await getBootstrapStatic();
  let gw = gwParam ? Number(gwParam) : null;
  if (!gw || Number.isNaN(gw)) {
    gw = bootstrap ? getCurrentGameweek(bootstrap) : null;
  }
  if (!gw) {
    gw = 1;
    warnings.push("Unable to detect current gameweek, defaulted to 1.");
  }

  const gwStatus = buildGwStatus(bootstrap, gw);
  if (gwStatus?.isFinished) {
    const cachedResults = await readResultsFile(gw);
    if (cachedResults) {
      const filteredMatchups = matchupId
        ? cachedResults.matchups.filter((matchup) => matchup.id === matchupId)
        : cachedResults.matchups;
      return NextResponse.json(
        {
          ...cachedResults,
          matchups: filteredMatchups,
          gwStatus
        },
        {
          headers: {
            "Cache-Control": CACHE_CONTROL_VALUE
          }
        }
      );
    }
  }

  const matchupsFile = matchupsData as MatchupsFile;
  const captainsFile = captainsData as CaptainsFile;
  const teamsFile = teamsData as TeamsFile;

  const gwKey = String(gw);
  let allMatchups =
    matchupsFile?.matchupsByGameweek?.[gwKey] ?? matchupsFile?.matchups ?? [];
  if (matchupsFile?.matchupsByGameweek && !matchupsFile.matchupsByGameweek[gwKey]) {
    warnings.push(`No matchups found for gw=${gw}.`);
  }

  const teamToManagers = new Map<string, number[]>();
  if (teamsFile?.teams) {
    for (const team of teamsFile.teams) {
      const entryIds = (team.members ?? [])
        .map((member) => member.entryId)
        .filter((entryId): entryId is number => typeof entryId === "number");
      teamToManagers.set(team.teamName, entryIds);
    }
  }

  const resolvedMatchups = allMatchups.map((matchup) => {
    const homeManagers =
      matchup.home.managers.length > 0
        ? matchup.home.managers
        : teamToManagers.get(matchup.home.name) ?? [];
    const awayManagers =
      matchup.away.managers.length > 0
        ? matchup.away.managers
        : teamToManagers.get(matchup.away.name) ?? [];

    if (homeManagers.length !== 2) {
      warnings.push(
        `Expected 2 managers for home team=${matchup.home.name} (matchup=${matchup.id}).`
      );
    }
    if (awayManagers.length !== 2) {
      warnings.push(
        `Expected 2 managers for away team=${matchup.away.name} (matchup=${matchup.id}).`
      );
    }

    return {
      ...matchup,
      home: { ...matchup.home, managers: homeManagers },
      away: { ...matchup.away, managers: awayManagers }
    };
  });

  const filteredMatchups = matchupId
    ? resolvedMatchups.filter((matchup) => matchup.id === matchupId)
    : resolvedMatchups;

  const managerMeta = new Map<number, { managerName?: string; fplTeamName?: string }>();
  if (teamsFile?.teams) {
    for (const team of teamsFile.teams) {
      for (const member of team.members ?? []) {
        if (typeof member.entryId === "number") {
          managerMeta.set(member.entryId, {
            managerName: member.managerName,
            fplTeamName: member.fplTeamName ?? undefined
          });
        }
      }
    }
  }

  const elementToTeam =
    bootstrap && Array.isArray(bootstrap?.elements)
      ? buildElementToTeamMap(bootstrap)
      : new Map();
  if (!bootstrap) {
    warnings.push(
      "Failed to fetch bootstrap-static; players left to play set to 0."
    );
  }

  const fixtures = await getEplFixturesForGw(gw);
  if (!fixtures) {
    warnings.push(
      `Failed to fetch fixtures for gw=${gw}; players left to play set to 0.`
    );
  }
  const teamHasUnstarted = fixtures ? buildTeamHasUnstartedMap(fixtures) : new Map();

  const liveEvent = await getEventLiveForGw(gw);
  if (!liveEvent) {
    warnings.push(
      `Failed to fetch live event data for gw=${gw}; using entry_history points.`
    );
  }
  const elementPoints = liveEvent ? buildElementPointsMap(liveEvent) : new Map();

  const uniqueEntryIds = getUniqueEntryIds(filteredMatchups);
  const managerStats = new Map<number, ManagerStats>();
  let missingElementWarning = false;

  await Promise.all(
    uniqueEntryIds.map(async (entryId) => {
      const picksData = await getEntryEventPicks(entryId, gw);
      if (!picksData) {
        warnings.push(
          `Failed to fetch picks for entryId=${entryId} (gw=${gw}), using 0.`
        );
        managerStats.set(entryId, {
          entryId,
          gwPoints: 0,
          playersLeftToPlay: 0
        });
        return;
      }

      let gwPoints = getGwPointsFromPicks(picksData);
      const picks = Array.isArray(picksData.picks) ? picksData.picks : [];
      let playersLeftToPlay = 0;

      if (elementPoints.size > 0) {
        let livePoints = 0;
        for (const pick of picks) {
          if (!pick || pick.multiplier <= 0) {
            continue;
          }
          const points = elementPoints.get(pick.element) ?? 0;
          livePoints += points * pick.multiplier;
        }
        gwPoints = livePoints;
      }

      if (elementToTeam.size > 0 && teamHasUnstarted.size > 0) {
        for (const pick of picks) {
          if (!pick || pick.multiplier <= 0) {
            continue;
          }
          const teamId = elementToTeam.get(pick.element);
          if (!teamId) {
            missingElementWarning = true;
            continue;
          }
          if (teamHasUnstarted.get(teamId)) {
            playersLeftToPlay += 1;
          }
        }
      }

      managerStats.set(entryId, {
        entryId,
        gwPoints,
        playersLeftToPlay
      });
    })
  );

  if (missingElementWarning) {
    warnings.push(
      "Missing element->team mapping for some players; treated as started."
    );
  }

  const matchupResponses = filteredMatchups.map((matchup) => {
    const captainConfig = resolveCaptainConfig(captainsFile, gw, matchup.id, warnings);
    return computeMatchupTotals(matchup, captainConfig, managerStats, managerMeta, warnings);
  });

  const response: LiveScoreApiResponse = {
    gw,
    generatedAt: new Date().toISOString(),
    matchups: matchupResponses,
    warnings,
    gwStatus
  };

  if (gwStatus?.isFinished) {
    const wrote = await writeResultsFile(gw, response);
    if (!wrote) {
      response.warnings = [
        ...response.warnings,
        "Unable to persist finished gameweek results in this environment."
      ];
    }
  }

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": CACHE_CONTROL_VALUE
    }
  });
}
