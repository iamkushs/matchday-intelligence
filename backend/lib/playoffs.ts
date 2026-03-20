import type { LiveScoreApiResponse, MatchupResponse } from "./types";

export type PlayoffLeg = {
  gw: number;
  leg: 1 | 2;
};

export type PlayoffFixture = {
  fixtureId: string;
  round: "Round of 16";
  competition: "tvt_playoffs";
  team1: string;
  team2: string;
  legs: PlayoffLeg[];
};

export type PlayoffLegScore = {
  gw: number;
  leg: 1 | 2;
  team1Score: number | null;
  team2Score: number | null;
  status: "upcoming" | "live" | "finished";
};

export type PlayoffAggregate = {
  aggregateTeam1Score: number | null;
  aggregateTeam2Score: number | null;
  aggregateLeader: "team1" | "team2" | "tied" | null;
  winner: "team1" | "team2" | null;
  winnerStatus: "pending" | "leg1_complete" | "live_aggregate" | "decided" | "tied";
};

const TVT_PLAYOFFS_FIXTURES: PlayoffFixture[] = [
  {
    fixtureId: "RO16-A",
    round: "Round of 16",
    competition: "tvt_playoffs",
    team1: "Jota Ke Chhorey",
    team2: "Scarlet Reds",
    legs: [
      { gw: 31, leg: 1 },
      { gw: 32, leg: 2 }
    ]
  },
  {
    fixtureId: "RO16-B",
    round: "Round of 16",
    competition: "tvt_playoffs",
    team1: "North Eastern Hillbillies",
    team2: "Dark Knights",
    legs: [
      { gw: 31, leg: 1 },
      { gw: 32, leg: 2 }
    ]
  },
  {
    fixtureId: "RO16-C",
    round: "Round of 16",
    competition: "tvt_playoffs",
    team1: "The Anfield Devils",
    team2: "Filthy Foxes",
    legs: [
      { gw: 31, leg: 1 },
      { gw: 32, leg: 2 }
    ]
  },
  {
    fixtureId: "RO16-D",
    round: "Round of 16",
    competition: "tvt_playoffs",
    team1: "xG Xorcists",
    team2: "Royal Indians",
    legs: [
      { gw: 31, leg: 1 },
      { gw: 32, leg: 2 }
    ]
  },
  {
    fixtureId: "RO16-E",
    round: "Round of 16",
    competition: "tvt_playoffs",
    team1: "Bianconeri Blues",
    team2: "Goal Diggers",
    legs: [
      { gw: 31, leg: 1 },
      { gw: 32, leg: 2 }
    ]
  },
  {
    fixtureId: "RO16-F",
    round: "Round of 16",
    competition: "tvt_playoffs",
    team1: "Blaugrana Cules",
    team2: "Footballing Gods",
    legs: [
      { gw: 31, leg: 1 },
      { gw: 32, leg: 2 }
    ]
  },
  {
    fixtureId: "RO16-G",
    round: "Round of 16",
    competition: "tvt_playoffs",
    team1: "Invisible Royals",
    team2: "Stretford Kops",
    legs: [
      { gw: 31, leg: 1 },
      { gw: 32, leg: 2 }
    ]
  },
  {
    fixtureId: "RO16-H",
    round: "Round of 16",
    competition: "tvt_playoffs",
    team1: "The Invincibles",
    team2: "Highbury Citizens",
    legs: [
      { gw: 31, leg: 1 },
      { gw: 32, leg: 2 }
    ]
  }
];

export function getTvtPlayoffsFixtures() {
  return TVT_PLAYOFFS_FIXTURES;
}

export function getTvtPlayoffFixture(fixtureId: string) {
  return TVT_PLAYOFFS_FIXTURES.find((fixture) => fixture.fixtureId === fixtureId) ?? null;
}

function getLegStatus(payload: LiveScoreApiResponse | null): PlayoffLegScore["status"] {
  if (!payload?.gwStatus) {
    return "upcoming";
  }
  if (payload.gwStatus.isFinished) {
    return "finished";
  }
  if (payload.gwStatus.isStarted) {
    return "live";
  }
  return "upcoming";
}

function findMatchupScore(
  payload: LiveScoreApiResponse | null,
  team1: string,
  team2: string
) {
  const matchups = Array.isArray(payload?.matchups) ? payload?.matchups : [];
  for (const matchup of matchups ?? []) {
    const home = matchup.home?.name;
    const away = matchup.away?.name;
    if (home === team1 && away === team2) {
      return {
        team1Score: matchup.home.totalPoints ?? null,
        team2Score: matchup.away.totalPoints ?? null
      };
    }
    if (home === team2 && away === team1) {
      return {
        team1Score: matchup.away.totalPoints ?? null,
        team2Score: matchup.home.totalPoints ?? null
      };
    }
  }
  return { team1Score: null, team2Score: null };
}

export function buildPlayoffLegScores(
  fixture: PlayoffFixture,
  leg1Payload: LiveScoreApiResponse | null,
  leg2Payload: LiveScoreApiResponse | null
): PlayoffLegScore[] {
  const [leg1, leg2] = fixture.legs;
  const leg1Scores = findMatchupScore(leg1Payload, fixture.team1, fixture.team2);
  const leg2Scores = findMatchupScore(leg2Payload, fixture.team1, fixture.team2);

  return [
    {
      gw: leg1.gw,
      leg: 1,
      team1Score: leg1Scores.team1Score,
      team2Score: leg1Scores.team2Score,
      status: getLegStatus(leg1Payload)
    },
    {
      gw: leg2.gw,
      leg: 2,
      team1Score: leg2Scores.team1Score,
      team2Score: leg2Scores.team2Score,
      status: getLegStatus(leg2Payload)
    }
  ];
}

export function buildAggregateSummary(legs: PlayoffLegScore[]): PlayoffAggregate {
  const leg1 = legs[0];
  const leg2 = legs[1];
  const hasAnyScore =
    typeof leg1.team1Score === "number" ||
    typeof leg1.team2Score === "number" ||
    typeof leg2.team1Score === "number" ||
    typeof leg2.team2Score === "number";

  const aggregateTeam1Score = hasAnyScore
    ? (leg1.team1Score ?? 0) + (leg2.team1Score ?? 0)
    : null;
  const aggregateTeam2Score = hasAnyScore
    ? (leg1.team2Score ?? 0) + (leg2.team2Score ?? 0)
    : null;

  let aggregateLeader: PlayoffAggregate["aggregateLeader"] = null;
  if (aggregateTeam1Score !== null && aggregateTeam2Score !== null) {
    if (aggregateTeam1Score > aggregateTeam2Score) {
      aggregateLeader = "team1";
    } else if (aggregateTeam2Score > aggregateTeam1Score) {
      aggregateLeader = "team2";
    } else {
      aggregateLeader = "tied";
    }
  }

  const leg1Finished = leg1.status === "finished";
  const leg2Finished = leg2.status === "finished";
  const leg2Live = leg2.status === "live";

  if (!hasAnyScore) {
    return {
      aggregateTeam1Score,
      aggregateTeam2Score,
      aggregateLeader,
      winner: null,
      winnerStatus: "pending"
    };
  }

  if (leg2Finished) {
    if (aggregateLeader === "team1") {
      return {
        aggregateTeam1Score,
        aggregateTeam2Score,
        aggregateLeader,
        winner: "team1",
        winnerStatus: "decided"
      };
    }
    if (aggregateLeader === "team2") {
      return {
        aggregateTeam1Score,
        aggregateTeam2Score,
        aggregateLeader,
        winner: "team2",
        winnerStatus: "decided"
      };
    }
    return {
      aggregateTeam1Score,
      aggregateTeam2Score,
      aggregateLeader,
      winner: null,
      winnerStatus: "tied"
    };
  }

  if (leg2Live) {
    return {
      aggregateTeam1Score,
      aggregateTeam2Score,
      aggregateLeader,
      winner: null,
      winnerStatus: "live_aggregate"
    };
  }

  if (leg1Finished) {
    return {
      aggregateTeam1Score,
      aggregateTeam2Score,
      aggregateLeader,
      winner: null,
      winnerStatus: "leg1_complete"
    };
  }

  return {
    aggregateTeam1Score,
    aggregateTeam2Score,
    aggregateLeader,
    winner: null,
    winnerStatus: "pending"
  };
}

export function getMatchupScores(payload: LiveScoreApiResponse | null) {
  const matchups = Array.isArray(payload?.matchups) ? payload?.matchups : [];
  return matchups as MatchupResponse[];
}
