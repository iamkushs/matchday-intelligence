import { NextResponse } from "next/server";
import matchupsData from "../../../data/matchups.json";
import captainsData from "../../../data/captains.json";
import teamsData from "../../../data/teams.json";
import path from "path";
import { promises as fs } from "fs";
import { getSupabaseAdmin } from "../../../lib/supabase";
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
  MatchupResponse,
  CaptainSelectionRow,
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
  selections: CaptainSelectionMap,
  gw: number,
  matchupId: string
) {
  const gwKey = String(gw);
  const override = captains?.byGameweek?.[gwKey]?.[matchupId];
  const fallback = captains?.default?.[matchupId];
  const config = override ?? fallback ?? null;

  const homeSelection = selections.get(getSelectionKey(matchupId, "home"));
  const awaySelection = selections.get(getSelectionKey(matchupId, "away"));

  const resolveSide = (
    selection: CaptainSelectionRow | undefined,
    configCaptain: number | null | undefined
  ) => {
    if (selection) {
      return {
        captainEntryId: selection.captain_entry_id ?? null,
        status: selection.status
      };
    }
    if (typeof configCaptain === "number") {
      return { captainEntryId: configCaptain, status: "selected" as const };
    }
    return { captainEntryId: null, status: "pending" as const };
  };

  const home = resolveSide(homeSelection, config?.homeCaptain);
  const away = resolveSide(awaySelection, config?.awayCaptain);

  return {
    homeCaptain: home.captainEntryId,
    awayCaptain: away.captainEntryId,
    homeStatus: home.status,
    awayStatus: away.status
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

type CaptainSelectionMap = Map<string, CaptainSelectionRow>;

function getSelectionKey(matchupId: string, side: "home" | "away") {
  return `${matchupId}:${side}`;
}

async function fetchCaptainSelections(
  gw: number,
  warnings: string[]
): Promise<CaptainSelectionMap> {
  const selections: CaptainSelectionMap = new Map();
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return selections;
  }
  const { data, error } = await supabase
    .from("captain_selections")
    .select("gw,matchup_id,side,captain_entry_id,status")
    .eq("gw", gw);
  if (error) {
    warnings.push("Unable to load captain selections from storage.");
    return selections;
  }
  for (const row of (data ?? []) as any[]) {
    if (!row?.matchup_id || (row.side !== "home" && row.side !== "away")) {
      continue;
    }
    selections.set(getSelectionKey(row.matchup_id, row.side), {
      gw: row.gw,
      matchup_id: row.matchup_id,
      side: row.side,
      captain_entry_id: row.captain_entry_id ?? null,
      status: row.status
    });
  }
  return selections;
}

async function readResults(gw: number, warnings: string[]) {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await (supabase as any)
      .from("gw_results")
      .select("payload")
      .eq("gw", gw)
      .maybeSingle();
    if (error) {
      warnings.push("Unable to load archived results from storage.");
    } else if (data?.payload) {
      return data.payload as LiveScoreApiResponse;
    }
  }
  return readResultsFile(gw);
}

async function writeResults(
  gw: number,
  payload: LiveScoreApiResponse,
  warnings: string[]
) {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await (supabase as any).from("gw_results").upsert([
      {
        gw,
        payload,
        updated_at: new Date().toISOString()
      }
    ]);
    if (!error) {
      return true;
    }
    warnings.push("Unable to persist finished gameweek results in storage.");
  }
  return writeResultsFile(gw, payload);
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
  const now = Date.now();
  const leadMs = 12 * 60 * 60 * 1000;
  let isWithinLead = false;
  if (typeof event?.deadline_time === "string") {
    const deadline = Date.parse(event.deadline_time);
    isWithinLead = !Number.isNaN(deadline) && now >= deadline - leadMs;
  }
  return {
    id: gw,
    name: event?.name,
    isCurrent: Boolean(event?.is_current),
    isNext: Boolean(event?.is_next),
    isFinished: Boolean(event?.finished),
    isStarted: Boolean(
      event?.is_current || event?.is_previous || event?.finished || isWithinLead
    )
  };
}

function hasGameweekStarted(bootstrap: any, gw: number) {
  const events = bootstrap?.events;
  if (!Array.isArray(events)) {
    return false;
  }
  const event = events.find((item: any) => item?.id === gw);
  if (!event) {
    return false;
  }
  if (event?.is_current || event?.is_previous || event?.finished) {
    return true;
  }
  if (typeof event?.deadline_time === "string") {
    const deadline = Date.parse(event.deadline_time);
    return !Number.isNaN(deadline) && Date.now() >= deadline;
  }
  return false;
}

function applyFallbackCaptains(payload: LiveScoreApiResponse) {
  payload.matchups = payload.matchups.map((matchup) => {
    const normalizeSide = (side: MatchupResponse["home"]) => {
      if (side.captainEntryId || side.captainStatus !== "pending") {
        return side;
      }
      if (!side.managers.length) {
        return side;
      }
      const fallbackCaptain = side.managers.reduce((best, current) =>
        current.gwPoints < best.gwPoints ? current : best
      );
      const updatedManagers = side.managers.map((manager) => ({
        ...manager,
        isCaptain: manager.entryId === fallbackCaptain.entryId
      }));
      return {
        ...side,
        captainEntryId: fallbackCaptain.entryId,
        captainBonus: fallbackCaptain.gwPoints,
        totalPoints: side.basePoints + fallbackCaptain.gwPoints,
        managers: updatedManagers
      };
    };

    return {
      ...matchup,
      home: normalizeSide(matchup.home),
      away: normalizeSide(matchup.away)
    };
  });
  return payload;
}

export async function GET(request: Request) {
  const warnings: string[] = [];
  const url = new URL(request.url);
  const gwParam = url.searchParams.get("gw");
  const matchupId = url.searchParams.get("matchupId");

  const bootstrap = await getBootstrapStatic();
  const activeGw = bootstrap ? getCurrentGameweek(bootstrap) : null;
  let gw = gwParam ? Number(gwParam) : null;
  if (!gw || Number.isNaN(gw)) {
    gw = activeGw;
  }
  if (!gw) {
    gw = 1;
    warnings.push("Unable to detect current gameweek, defaulted to 1.");
  }

  const gwStatus = buildGwStatus(bootstrap, gw);
  if (activeGw && gw > activeGw) {
    const response: LiveScoreApiResponse = {
      gw,
      activeGw,
      generatedAt: new Date().toISOString(),
      matchups: [],
      warnings: [`Gameweek ${gw} has not started yet. Check back later.`],
      gwStatus
    };
    return NextResponse.json(response, {
      headers: {
        "Cache-Control": CACHE_CONTROL_VALUE
      }
    });
  }

  if (activeGw && gw < activeGw) {
    const cachedResults = await readResults(gw, warnings);
    if (cachedResults) {
      const normalized = applyFallbackCaptains(cachedResults);
      const filteredMatchups = matchupId
        ? normalized.matchups.filter((matchup) => matchup.id === matchupId)
        : normalized.matchups;
      return NextResponse.json(
        {
          ...normalized,
          activeGw,
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

    const response: LiveScoreApiResponse = {
      gw,
      activeGw,
      generatedAt: new Date().toISOString(),
      matchups: [],
      warnings: [`Archived results for gameweek ${gw} are not available yet.`],
      gwStatus
    };
    return NextResponse.json(response, {
      headers: {
        "Cache-Control": CACHE_CONTROL_VALUE
      }
    });
  }
  if (gwStatus?.isFinished) {
    const cachedResults = await readResults(gw, warnings);
    if (cachedResults) {
      const normalized = applyFallbackCaptains(cachedResults);
      const filteredMatchups = matchupId
        ? normalized.matchups.filter((matchup) => matchup.id === matchupId)
        : normalized.matchups;
      return NextResponse.json(
        {
          ...normalized,
          activeGw,
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
  const captainSelections = await fetchCaptainSelections(gw, warnings);

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

  const canFetchPicks = hasGameweekStarted(bootstrap, gw);

  await Promise.all(
    uniqueEntryIds.map(async (entryId) => {
      if (!canFetchPicks) {
        managerStats.set(entryId, {
          entryId,
          gwPoints: 0,
          playersLeftToPlay: 0
        });
        return;
      }

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
    const captainConfig = resolveCaptainConfig(
      captainsFile,
      captainSelections,
      gw,
      matchup.id
    );
    return computeMatchupTotals(matchup, captainConfig, managerStats, managerMeta, warnings);
  });

  const response: LiveScoreApiResponse = {
    gw,
    activeGw,
    generatedAt: new Date().toISOString(),
    matchups: matchupResponses,
    warnings,
    gwStatus
  };

  if (gwStatus?.isFinished) {
    const wrote = await writeResults(gw, response, warnings);
    if (!wrote) {
      response.warnings = [
        ...response.warnings,
        "Unable to persist finished gameweek results."
      ];
    }
  }

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": CACHE_CONTROL_VALUE
    }
  });
}
