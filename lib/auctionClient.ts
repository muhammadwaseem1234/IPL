"use client";

import type { Franchise } from "@/lib/constants";

export type SnapshotPlayer = {
  id: string;
  name: string;
  nationality: string | null;
  category: string | null;
  role: string;
  base_price: number;
  ais: number;
  batting: number;
  bowling: number;
  fielding: number;
  leadership: number;
  image_path: string | null;
};

export type SnapshotAuctionState = {
  id: string;
  current_player_id: string | null;
  status: string;
  current_bid: number;
  current_leader_device_id: string | null;
  timer_end: string | null;
  updated_at: string;
};

export type SnapshotTeam = {
  id: string;
  franchise: Franchise;
  purse: number;
  device_id: string | null;
};

export type SnapshotSquad = {
  id: string;
  franchise: Franchise;
  player_id: string;
  price: number;
  players: {
    id: string;
    name: string;
    nationality: string | null;
    category: string | null;
    role: string;
    ais: number;
    image_path: string | null;
  } | null;
};

export type SnapshotEvaluation = {
  id: string;
  franchise: Franchise;
  base_score: number;
  bonus: number;
  efficiency: number;
  penalties: number;
  final_score: number;
};

export type AuctionSnapshot = {
  server_now: string;
  remaining_seconds: number;
  auction_state: SnapshotAuctionState | null;
  current_player: SnapshotPlayer | null;
  teams: SnapshotTeam[];
  squads: SnapshotSquad[];
  players: SnapshotPlayer[];
  unsold_count: number;
  evaluation_results: SnapshotEvaluation[];
};

export async function fetchAuctionSnapshot(): Promise<AuctionSnapshot> {
  const response = await fetch("/api/auction/state", { cache: "no-store" });
  const payload = (await response.json()) as {
    ok: boolean;
    message?: string;
    data?: AuctionSnapshot;
  };

  if (!response.ok || !payload.ok || !payload.data) {
    throw new Error(payload.message ?? "Failed to fetch auction state.");
  }

  return payload.data;
}

export async function postAuctionAction(params: {
  action:
    | "start"
    | "pause"
    | "resume"
    | "assign"
    | "stop"
    | "next"
    | "reset"
    | "evaluate"
    | "placeBid";
  deviceId?: string;
  amount?: number;
}): Promise<{ ok: boolean; message: string; data?: unknown }> {
  const response = await fetch("/api/auction", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const payload = (await response.json()) as {
    ok: boolean;
    message: string;
    data?: unknown;
  };

  if (!response.ok && !payload.ok) {
    return payload;
  }

  return payload;
}
