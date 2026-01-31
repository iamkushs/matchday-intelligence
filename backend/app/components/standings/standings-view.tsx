"use client";

import { useMemo } from "react";
import type { RankingsApiResponse, RankingsRow } from "../../../lib/types";
import { Skeleton } from "../ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

type StandingsViewProps = {
  data: RankingsApiResponse | null;
  selectedGroup: "A" | "B";
  onGroupChange: (group: "A" | "B") => void;
  isLoading: boolean;
  error: string | null;
};

const groupLabels = {
  A: "Group A",
  B: "Group B"
};

export function StandingsView({
  data,
  selectedGroup,
  onGroupChange,
  isLoading,
  error
}: StandingsViewProps) {
  const standings = useMemo(() => {
    if (!data) {
      return [] as RankingsRow[];
    }
    return selectedGroup === "A" ? data.groupA : data.groupB;
  }, [data, selectedGroup]);

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: "var(--fpl-bg-deep)", color: "var(--fpl-text-primary)" }}
    >
      <div className="px-4 pt-8 pb-6">
        <h1
          className="mb-1"
          style={{
            fontSize: "28px",
            fontWeight: "600",
            letterSpacing: "-0.02em",
            color: "var(--fpl-text-primary)"
          }}
        >
          Standings
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "var(--fpl-text-muted)",
            fontWeight: "400"
          }}
        >
          Season Standings
        </p>
      </div>

      <div className="px-4 pb-6">
        <div
          className="relative p-1 rounded-xl"
          style={{
            backgroundColor: "rgba(26, 26, 34, 0.6)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)"
          }}
        >
          <div
            className="absolute top-1 bottom-1 rounded-lg transition-all duration-300 ease-out"
            style={{
              left: selectedGroup === "A" ? "4px" : "calc(50%)",
              right: selectedGroup === "A" ? "calc(50%)" : "4px",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow:
                "0 0 0 1px rgba(0, 255, 135, 0.2), 0 2px 8px rgba(0, 0, 0, 0.2)"
            }}
          />
          <div className="flex gap-0 relative z-10">
            {(["A", "B"] as const).map((group) => (
              <button
                key={group}
                onClick={() => onGroupChange(group)}
                className="flex-1 py-3 px-4 rounded-lg transition-all duration-200"
                style={{
                  color:
                    selectedGroup === group
                      ? "var(--fpl-text-primary)"
                      : "var(--fpl-text-muted)",
                  fontSize: "15px",
                  fontWeight: "500",
                  letterSpacing: "-0.01em"
                }}
              >
                {groupLabels[group]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 pb-6">
        {error && (
          <div
            className="text-xs px-3 py-2 rounded-lg mb-3"
            style={{ color: "var(--fpl-text-muted)", backgroundColor: "rgba(255,255,255,0.05)" }}
          >
            Could not refresh standings.
          </div>
        )}

        {isLoading && standings.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12 rounded-lg bg-white/5" />
            ))}
          </div>
        ) : standings.length === 0 ? (
          <div
            className="text-sm px-3 py-4 rounded-lg"
            style={{ color: "var(--fpl-text-muted)", backgroundColor: "rgba(255,255,255,0.05)" }}
          >
            No standings available for this gameweek.
          </div>
        ) : (
          <div
            className="rounded-xl"
            style={{
              backgroundColor: "var(--fpl-bg-card)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.05)"
            }}
          >
            <Table className="text-sm">
              <TableHeader>
                <TableRow
                  className="text-[11px] uppercase tracking-wider"
                  style={{ color: "var(--fpl-text-muted)" }}
                >
                  <TableHead className="px-3 py-2 text-left">Rank</TableHead>
                  <TableHead className="px-3 py-2 text-left">Team</TableHead>
                  <TableHead className="px-3 py-2 text-right">MP</TableHead>
                  <TableHead className="px-3 py-2 text-right">W</TableHead>
                  <TableHead className="px-3 py-2 text-right">D</TableHead>
                  <TableHead className="px-3 py-2 text-right">L</TableHead>
                  <TableHead className="px-3 py-2 text-right">CP/BP</TableHead>
                  <TableHead className="px-3 py-2 text-right">Points</TableHead>
                  <TableHead className="px-3 py-2 text-right">Overall</TableHead>
                  <TableHead className="px-3 py-2 text-left">Qualifying for</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standings.map((row) => (
                  <TableRow
                    key={`${row.team_name}-${row.rank}`}
                    style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <TableCell className="px-3 py-3 font-semibold">{row.rank}</TableCell>
                    <TableCell className="px-3 py-3">{row.team_name}</TableCell>
                    <TableCell className="px-3 py-3 text-right">{row.mp}</TableCell>
                    <TableCell className="px-3 py-3 text-right">{row.w}</TableCell>
                    <TableCell className="px-3 py-3 text-right">{row.d}</TableCell>
                    <TableCell className="px-3 py-3 text-right">{row.l}</TableCell>
                    <TableCell className="px-3 py-3 text-right">{row.cp_bp}</TableCell>
                    <TableCell className="px-3 py-3 text-right font-semibold">
                      {row.points}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-right">
                      {row.overall_scores}
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <span
                        className="inline-flex items-center px-2 py-1 rounded-full text-[11px]"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.08)",
                          color: "var(--fpl-text-primary)"
                        }}
                      >
                        {row.qualifying_for}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="h-20" />
    </div>
  );
}
