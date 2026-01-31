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
  homeCaptain: number | null;
  awayCaptain: number | null;
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
  captainStatus: CaptainSelectionStatus;
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
  homeBaseLeaguePoints: 0 | 1 | 2;
  awayBaseLeaguePoints: 0 | 1 | 2;
  homeFinalLeaguePoints: number;
  awayFinalLeaguePoints: number;
  homeChipType: "double_pointer" | "challenge" | "win_win" | null;
  awayChipType: "double_pointer" | "challenge" | "win_win" | null;
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
  activeGw: number | null;
  generatedAt: string;
  matchups: MatchupResponse[];
  challengeFixtures: ChallengeFixture[];
  warnings: string[];
  gwStatus: GameweekStatus | null;
};

export type CaptainSelectionStatus = "pending" | "selected" | "unannounced";

export type CaptainSelectionRow = {
  gw: number;
  matchup_id: string;
  side: "home" | "away";
  captain_entry_id: number | null;
  status: CaptainSelectionStatus;
};

export type GameweekStatus = {
  id: number;
  name?: string;
  isCurrent: boolean;
  isNext: boolean;
  isFinished: boolean;
  isStarted: boolean;
};

export type RankingsRow = {
  rank: number;
  team_name: string;
  mp: number;
  w: number;
  d: number;
  l: number;
  cp_bp: number;
  points: number;
  overall_scores: number;
  qualifying_for: string;
};

export type RankingsApiResponse = {
  gw: number;
  baselineGw: number;
  groupA: RankingsRow[];
  groupB: RankingsRow[];
  warnings: string[];
  sourceSummary: Array<{
    gw: number;
    source: "live" | "archived";
    archivedStatus: "finished" | "live" | null;
  }>;
};

export type ChallengeFixture = {
  gw: number;
  challengerTeamName: string;
  opponentTeamName: string;
  challengerManagers: number[];
  opponentManagers: number[];
  challengerTvtPoints: number;
  opponentTvtPoints: number;
  challengerBaseLeaguePoints: 0 | 1 | 2;
  createdFromChip: "challenge";
};

export type ElementToTeamMap = Map<number, number>;
export type TeamHasUnstartedMap = Map<number, boolean>;
