"use client";

import { useParams } from "next/navigation";
import { TvtPlayoffDetail } from "../../../components/playoffs/tvt-playoff-detail";

export default function TvtPlayoffDetailPage() {
  const params = useParams();
  const fixtureId = typeof params.fixtureId === "string" ? params.fixtureId : "";
  return <TvtPlayoffDetail fixtureId={fixtureId} />;
}
