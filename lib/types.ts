import type { Franchise } from "@/lib/constants";

export type DeviceRole = "admin" | "view" | "auction" | "backup";
export type AuctionStatus = "waiting" | "running" | "paused" | "assigned" | "completed";

export type DeviceRecord = {
  id: string;
  fingerprint: string;
  role: DeviceRole;
  franchise: Franchise | null;
  connected_at: string;
  active: boolean;
};

export type PlayerRecord = {
  id: string;
  name: string;
  nationality: string | null;
  category: string | null;
  role: string;
  base_price: number;
  ais: number;
  batting: number | null;
  bowling: number | null;
  fielding: number | null;
  leadership: number | null;
  image_path: string | null;
};

export type TeamRecord = {
  id: string;
  franchise: Franchise;
  purse: number;
  device_id: string | null;
};

export type AuctionStateRecord = {
  id: string;
  current_player_id: string | null;
  status: AuctionStatus;
  current_bid: number;
  current_leader_device_id: string | null;
  timer_end: string | null;
  updated_at: string;
};

export type SquadRecord = {
  id: string;
  franchise: Franchise;
  player_id: string;
  price: number;
};

export type EvaluationResultRecord = {
  id: string;
  franchise: Franchise;
  base_score: number;
  bonus: number;
  efficiency: number;
  penalties: number;
  final_score: number;
};
