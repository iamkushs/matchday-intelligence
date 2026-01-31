import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase";
import type { CaptainSelectionStatus } from "../../../lib/types";

type CaptainSelectionBody = {
  gw: number;
  matchupId: string;
  side: "home" | "away";
  captainEntryId?: number | null;
  status: CaptainSelectionStatus;
};

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Storage is not configured." },
      { status: 503 }
    );
  }

  let payload: CaptainSelectionBody | null = null;
  try {
    payload = (await request.json()) as CaptainSelectionBody;
  } catch {
    payload = null;
  }

  if (
    !payload ||
    typeof payload.gw !== "number" ||
    !payload.matchupId ||
    (payload.side !== "home" && payload.side !== "away")
  ) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (payload.status !== "selected" && payload.status !== "unannounced") {
    return NextResponse.json({ error: "Invalid captain status." }, { status: 400 });
  }

  if (payload.status === "selected" && typeof payload.captainEntryId !== "number") {
    return NextResponse.json(
      { error: "Captain entryId is required." },
      { status: 400 }
    );
  }

  if (payload.status === "unannounced") {
    payload.captainEntryId = null;
  }

  const { data: existing, error: existingError } = await supabase
    .from("captain_selections")
    .select("gw")
    .eq("gw", payload.gw)
    .eq("matchup_id", payload.matchupId)
    .eq("side", payload.side)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json(
      { error: "Unable to verify captain selection." },
      { status: 500 }
    );
  }

  if (existing) {
    return NextResponse.json(
      { error: "Captain already selected." },
      { status: 409 }
    );
  }

  const { error } = await supabase.from("captain_selections").insert({
    gw: payload.gw,
    matchup_id: payload.matchupId,
    side: payload.side,
    captain_entry_id: payload.captainEntryId ?? null,
    status: payload.status
  });

  if (error) {
    return NextResponse.json(
      { error: "Unable to save captain selection." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
