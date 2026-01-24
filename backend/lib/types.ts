export type MatchupSideConfig = {
  name: string;
  managers: number[];
};

export type MatchupConfig = {
  id: string;
  home: MatchupSideConfig;
  away: MatchupSideConfig;
};

export type MatchupsFile = {
  leagueId: number | null;
  matchupsByGameweek?: Record<string, MatchupConfig[]>;
  matchups?: MatchupConfig[];
};

export type CaptainOverride = {
  homeCaptain: number;
  awayCaptain: number;
};

export type CaptainsFile = {
  default: Record<string, CaptainOverride>;
  byGameweek: Record<string, Record<string, CaptainOverride>>;
};

export type ManagerResponse = {
  entryId: number;
  gwPoints: number;
  playersLeftToPlay: number;
  isCaptain: boolean;
  managerName?: string;
  fplTeamName?: string;
};

export type SideResponse = {
  name: string;
  captainEntryId: number | null;
  basePoints: number;
  captainBonus: number;
  totalPoints: number;
  playersLeftToPlay: number;
  managers: ManagerResponse[];
};

export type MatchupResponse = {
  id: string;
  home: SideResponse;
  away: SideResponse;
};

export type EntryEventPicks = {
  entry_history?: {
    points?: number;
  };
  picks?: Array<{
    element: number;
    multiplier: number;
  }>;
};

export type ManagerStats = {
  entryId: number;
  gwPoints: number;
  playersLeftToPlay: number;
};

export type TeamMember = {
  managerKey: string;
  managerName: string;
  entryId: number | null;
  fplTeamName: string | null;
};

export type TeamConfig = {
  teamName: string;
  members: TeamMember[];
};

export type TeamsFile = {
  leagueId: number;
  teams: TeamConfig[];
};

export type LiveScoreApiResponse = {
  gw: number;
  generatedAt: string;
  matchups: MatchupResponse[];
  warnings: string[];
};

export type ElementToTeamMap = Map<number, number>;
export type TeamHasUnstartedMap = Map<number, boolean>;
