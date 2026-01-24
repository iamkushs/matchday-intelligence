import type {
  ElementToTeamMap,
  EntryEventPicks,
  TeamHasUnstartedMap
} from "./types";

const BOOTSTRAP_URL = "https://fantasy.premierleague.com/api/bootstrap-static/";
const FIXTURES_URL = "https://fantasy.premierleague.com/api/fixtures/?event=";
const EVENT_LIVE_URL = "https://fantasy.premierleague.com/api/event";
const PICKS_URL = "https://fantasy.premierleague.com/api/entry";

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const bootstrapCache: { entry: CacheEntry<any> | null } = { entry: null };
const fixturesCache = new Map<number, CacheEntry<any>>();
const liveEventCache = new Map<number, CacheEntry<any>>();
const picksCache = new Map<string, CacheEntry<EntryEventPicks>>();

const BOOTSTRAP_TTL_MS = 12 * 60 * 60 * 1000;
const FIXTURES_TTL_MS = 30 * 1000;
const LIVE_EVENT_TTL_MS = 10 * 1000;
const PICKS_TTL_MS = 10 * 1000;

export async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
  init?: RequestInit
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store"
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJsonWithRetry<T>(url: string, timeoutMs: number) {
  try {
    const response = await fetchWithTimeout(url, timeoutMs);
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    try {
      const response = await fetchWithTimeout(url, timeoutMs);
      if (!response.ok) {
        return null;
      }
      return (await response.json()) as T;
    } catch {
      return null;
    }
  }
}

export async function getBootstrapStatic() {
  const now = Date.now();
  if (bootstrapCache.entry && bootstrapCache.entry.expiresAt > now) {
    return bootstrapCache.entry.data;
  }

  const data = await fetchJsonWithRetry<any>(BOOTSTRAP_URL, 8000);
  if (data) {
    bootstrapCache.entry = {
      data,
      expiresAt: now + BOOTSTRAP_TTL_MS
    };
  }
  return data;
}

export function getCurrentGameweek(bootstrapData: any) {
  const events = bootstrapData?.events;
  if (!Array.isArray(events) || events.length === 0) {
    return null;
  }

  const current = events.find((event: any) => event?.is_current);
  if (current?.id) {
    return current.id as number;
  }

  const next = events.find((event: any) => event?.is_next);
  if (next?.id) {
    return next.id as number;
  }

  const finished = events
    .filter((event: any) => event?.finished)
    .sort((a: any, b: any) => (b?.id ?? 0) - (a?.id ?? 0))[0];
  return finished?.id ?? null;
}

export async function getEplFixturesForGw(gw: number) {
  const now = Date.now();
  const cached = fixturesCache.get(gw);
  if (cached && cached.expiresAt > now) {
    return cached.data as any[];
  }

  const data = await fetchJsonWithRetry<any[]>(`${FIXTURES_URL}${gw}`, 8000);
  if (data) {
    fixturesCache.set(gw, { data, expiresAt: now + FIXTURES_TTL_MS });
  }
  return data;
}

export async function getEventLiveForGw(gw: number) {
  const now = Date.now();
  const cached = liveEventCache.get(gw);
  if (cached && cached.expiresAt > now) {
    return cached.data as any;
  }

  const data = await fetchJsonWithRetry<any>(`${EVENT_LIVE_URL}/${gw}/live/`, 8000);
  if (data) {
    liveEventCache.set(gw, { data, expiresAt: now + LIVE_EVENT_TTL_MS });
  }
  return data;
}

export async function getEntryEventPicks(entryId: number, gw: number) {
  const now = Date.now();
  const key = `${entryId}-${gw}`;
  const cached = picksCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const data = await fetchJsonWithRetry<EntryEventPicks>(
    `${PICKS_URL}/${entryId}/event/${gw}/picks/`,
    8000
  );
  if (data) {
    picksCache.set(key, { data, expiresAt: now + PICKS_TTL_MS });
  }
  return data;
}

export function buildElementToTeamMap(bootstrapData: any): ElementToTeamMap {
  const map: ElementToTeamMap = new Map();
  const elements = bootstrapData?.elements;
  if (!Array.isArray(elements)) {
    return map;
  }

  for (const element of elements) {
    if (typeof element?.id === "number" && typeof element?.team === "number") {
      map.set(element.id, element.team);
    }
  }
  return map;
}

type Fixture = {
  started?: boolean | null;
  kickoff_time?: string | null;
  team_h: number;
  team_a: number;
};

export function buildTeamHasUnstartedMap(fixtures: Fixture[]): TeamHasUnstartedMap {
  const map: TeamHasUnstartedMap = new Map();
  if (!Array.isArray(fixtures)) {
    return map;
  }

  const now = Date.now();
  for (const fixture of fixtures) {
    const startedField = fixture?.started;
    let started = false;
    if (typeof startedField === "boolean") {
      started = startedField;
    } else if (fixture?.kickoff_time) {
      const kickoff = Date.parse(fixture.kickoff_time);
      started = Number.isNaN(kickoff) ? true : kickoff <= now;
    }

    if (!started) {
      if (typeof fixture?.team_h === "number") {
        map.set(fixture.team_h, true);
      }
      if (typeof fixture?.team_a === "number") {
        map.set(fixture.team_a, true);
      }
    }
  }

  return map;
}

export function buildElementPointsMap(liveData: any): Map<number, number> {
  const map = new Map<number, number>();
  const elements = liveData?.elements;
  if (!Array.isArray(elements)) {
    return map;
  }

  for (const element of elements) {
    const id = element?.id;
    const points = element?.stats?.total_points;
    if (typeof id === "number") {
      map.set(id, typeof points === "number" ? points : 0);
    }
  }
  return map;
}
