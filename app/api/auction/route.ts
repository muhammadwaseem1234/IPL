import { NextResponse } from "next/server";

import {
  assignPlayerToWinner,
  computeEvaluationResults,
  nextPlayer,
  pauseAuction,
  placeBid,
  resetAuction,
  resumeAuction,
  startAuction,
} from "@/actions/auctionActions";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

type AuctionAction =
  | "start"
  | "pause"
  | "resume"
  | "assign"
  | "stop"
  | "next"
  | "reset"
  | "evaluate"
  | "placeBid";

type ActionBody = {
  action?: AuctionAction;
  deviceId?: string;
  amount?: number;
};

async function isAdminDevice(deviceId: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("devices")
    .select("role, active")
    .eq("id", deviceId)
    .single();

  if (error || !data) return false;
  return data.role === "admin" && data.active === true;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as ActionBody;
  const action = body.action;
  const deviceId = body.deviceId;
  const amount = body.amount;

  if (!action) {
    return NextResponse.json({ ok: false, message: "Missing action." }, { status: 400 });
  }

  const adminOnlyActions: AuctionAction[] = [
    "start",
    "pause",
    "resume",
    "assign",
    "stop",
    "next",
    "reset",
    "evaluate",
  ];

  if (adminOnlyActions.includes(action)) {
    if (!deviceId) {
      return NextResponse.json(
        { ok: false, message: "Admin device id is required." },
        { status: 400 },
      );
    }

    const isAdmin = await isAdminDevice(deviceId);
    if (!isAdmin) {
      return NextResponse.json(
        { ok: false, message: "Only admin device can perform this action." },
        { status: 403 },
      );
    }
  }

  switch (action) {
    case "start":
      return NextResponse.json(await startAuction());
    case "pause":
      return NextResponse.json(await pauseAuction());
    case "resume":
      return NextResponse.json(await resumeAuction());
    case "assign":
    case "stop":
      return NextResponse.json(await assignPlayerToWinner());
    case "next":
      return NextResponse.json(await nextPlayer());
    case "reset":
      return NextResponse.json(await resetAuction());
    case "evaluate":
      return NextResponse.json(await computeEvaluationResults());
    case "placeBid": {
      if (!deviceId) {
        return NextResponse.json(
          { ok: false, message: "Device id is required for bidding." },
          { status: 400 },
        );
      }

      if (typeof amount !== "number" || Number.isNaN(amount)) {
        return NextResponse.json(
          { ok: false, message: "Valid amount is required for bidding." },
          { status: 400 },
        );
      }

      return NextResponse.json(await placeBid(deviceId, amount));
    }
    default:
      return NextResponse.json({ ok: false, message: "Unsupported action." }, { status: 400 });
  }
}
