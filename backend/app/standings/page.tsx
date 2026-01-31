"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StandingsView } from "../components/standings/standings-view";
import { useLiveScore } from "../../lib/useLiveScore";
import { useRankings } from "../../lib/useRankings";

const DEFAULT_GW = 24;

export default function StandingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const groupParam = searchParams.get("group");
  const [selectedGroup, setSelectedGroup] = useState<"A" | "B">(
    groupParam === "B" ? "B" : "A"
  );

  const { data: liveData } = useLiveScore(20000);
  const activeGw = liveData?.activeGw ?? liveData?.gw ?? DEFAULT_GW;

  const { data, isLoading, error } = useRankings(activeGw, 20000);

  useEffect(() => {
    if (groupParam === "A" || groupParam === "B") {
      setSelectedGroup(groupParam);
    }
  }, [groupParam]);

  const handleGroupChange = (group: "A" | "B") => {
    setSelectedGroup(group);
    const params = new URLSearchParams(searchParams.toString());
    params.set("group", group);
    router.replace(`/standings?${params.toString()}`);
  };

  return (
    <StandingsView
      data={data}
      selectedGroup={selectedGroup}
      onGroupChange={handleGroupChange}
      isLoading={isLoading}
      error={error}
    />
  );
}
