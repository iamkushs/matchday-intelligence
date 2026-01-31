"use client";

import { Suspense } from "react";
import { StandingsClientPage } from "./standings-client";

export default function StandingsPage() {
  return (
    <Suspense>
      <StandingsClientPage />
    </Suspense>
  );
}
