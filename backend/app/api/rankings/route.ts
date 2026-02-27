import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { getSupabaseAdmin } from "../../../lib/supabase";
import { getBootstrapStatic, getCurrentGameweek } from "../../../lib/fpl";
import type { LiveScoreApiResponse, MatchupResponse } from "../../../lib/types";
import {
  applyMatchupDelta,
  buildGroupIndex,
  buildRankedResponse,
  cloneStandings,
  incrementMatchesPlayed,
  isArchivedFinished,
  loadBaselineStandings,
  sortAndRank,
  type SourceSummary
} from "../../../lib/rankings";

const CACHE_CONTROL_VALUE = "s-maxage=10, stale-while-revalidate=30";

async function readResultsFile(gw: number) {
  try {
    const fullPath = path.join(process.cwd(), "data", "results", `gw-${gw}.json`);
    const data = await fs.readFile(fullPath, "utf8");
    return JSON.parse(data) as LiveScoreApiResponse;
  } catch {
    return null;
  }
}

async function loadArchivedPayloads(
  gws: number[],
  warnings: string[]
): Promise<Map<number, LiveScoreApiResponse>> {
  const map = new Map<number, LiveScoreApiResponse>();
  if (gws.length === 0) {
    return map;
  }
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await (supabase as any)
      .from("gw_results")
      .select("gw,payload")
      .in("gw", gws);
    if (error) {
      warnings.push("Unable to load archived gw_results from storage.");
    } else {
      for (const row of (data ?? []) as any[]) {
        if (typeof row?.gw === "number" && row?.payload) {
          map.set(row.gw, row.payload as LiveScoreApiResponse);
        }
      }
    }
  }

  if (map.size < gws.length) {
    for (const gw of gws) {
      if (map.has(gw)) continue;
      const filePayload = await readResultsFile(gw);
      if (filePayload) {
        map.set(gw, filePayload);
      }
    }
  }

  return map;
}

async function fetchLivePayload(gw: number, origin: string) {
  const url = `${origin}/api/live-score?gw=${gw}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as LiveScoreApiResponse;
}

function normalizeMatchups(payload: LiveScoreApiResponse | null) {
  const matchups = payload?.matchups;
  return Array.isArray(matchups) ? (matchups as MatchupResponse[]) : [];
}

export async function GET(request: Request) {
  const warnings: string[] = [];
  const url = new URL(request.url);
  const gwParam = url.searchParams.get("gw");

  const bootstrap = await getBootstrapStatic();
  const activeGw = bootstrap ? getCurrentGameweek(bootstrap) : null;
  const parsedGw = gwParam ? Number(gwParam) : NaN;
  const gw = !Number.isNaN(parsedGw)
    ? parsedGw
    : activeGw ?? 23;

  const groupA = await loadBaselineStandings("standings_group_a.json");
  const groupB = await loadBaselineStandings("standings_group_b.json");
  const groupIndex = buildGroupIndex(groupA, groupB);

  if (gw <= 27) {
    const sortedA = groupA.slice().sort((a, b) => a.rank - b.rank);
    const sortedB = groupB.slice().sort((a, b) => a.rank - b.rank);
    return NextResponse.json(
      {
        gw,
        baselineGw: 27,
        groupA: buildRankedResponse(sortedA),
        groupB: buildRankedResponse(sortedB),
        warnings,
        sourceSummary: []
      },
      {
        headers: {
          "Cache-Control": CACHE_CONTROL_VALUE
        }
      }
    );
  }

  const standingsA = cloneStandings(groupA);
  const standingsB = cloneStandings(groupB);

  const gws = [];
  for (let current = 24; current <= gw; current += 1) {
    gws.push(current);
  }

  const archivedPayloads = await loadArchivedPayloads(gws, warnings);
  const sourceSummary: SourceSummary[] = [];

  for (const currentGw of gws) {
    const archived = archivedPayloads.get(currentGw) ?? null;
    const archivedFinished = isArchivedFinished(archived);
    let payload: LiveScoreApiResponse | null = null;
    let source: SourceSummary["source"] = "live";
    let archivedStatus: SourceSummary["archivedStatus"] = null;

    if (archived && archivedFinished) {
      payload = archived;
      source = "archived";
      archivedStatus = "finished";
    } else if (archived) {
      payload = archived;
      source = "archived";
      archivedStatus = "live";
    } else {
      payload = await fetchLivePayload(currentGw, url.origin);
      if (!payload) {
        warnings.push(`Unable to load live payload for gw=${currentGw}.`);
        sourceSummary.push({
          gw: currentGw,
          source: "live",
          archivedStatus: null
        });
        continue;
      }
    }

    sourceSummary.push({
      gw: currentGw,
      source,
      archivedStatus
    });

    const matchups = normalizeMatchups(payload);
    if (!matchups.length) {
      continue;
    }

    incrementMatchesPlayed(standingsA, standingsB);
    for (const matchup of matchups) {
      applyMatchupDelta(
        matchup,
        standingsA,
        standingsB,
        groupIndex,
        warnings
      );
    }
  }

  const rankedA = sortAndRank(standingsA);
  const rankedB = sortAndRank(standingsB);

  return NextResponse.json(
    {
      gw,
      baselineGw: 27,
      groupA: buildRankedResponse(rankedA),
      groupB: buildRankedResponse(rankedB),
      warnings,
      sourceSummary
    },
    {
      headers: {
        "Cache-Control": CACHE_CONTROL_VALUE
      }
    }
  );
}
