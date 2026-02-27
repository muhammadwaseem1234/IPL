import "server-only";

import {
  AUCTION_BID_TIMER_SECONDS,
  AUCTION_START_TIMER_SECONDS,
  FRANCHISES,
  TEAM_PURSE_CR,
} from "@/lib/constants";
import type { Franchise } from "@/lib/constants";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { AuctionStateRecord, DeviceRole, PlayerRecord } from "@/lib/types";

type ActionResult<T = unknown> = {
  ok: boolean;
  message: string;
  data?: T;
};

type DeviceRow = {
  id: string;
  role: DeviceRole;
  franchise: Franchise | null;
  active: boolean;
};

type TeamRow = {
  id: string;
  franchise: Franchise;
  purse: number | string;
  device_id: string | null;
};

type SquadPlayerJoin = {
  franchise: Franchise;
  price: number | string;
  players:
    | {
        id: string;
        name: string;
        role: string;
        ais: number | string;
      }
    | Array<{
        id: string;
        name: string;
        role: string;
        ais: number | string;
      }>
    | null;
};

type EvalRow = {
  franchise: Franchise;
  base_score: number;
  bonus: number;
  efficiency: number;
  penalties: number;
  final_score: number;
};

function asNumber(value: number | string | null | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeRole(role: string): "WK" | "BAT" | "BOWL" | "AR" {
  const normalized = role.toLowerCase().trim();

  if (normalized.includes("wicket") || normalized === "wk") return "WK";
  if (normalized.includes("all round") || normalized.includes("allround") || normalized === "ar")
    return "AR";
  if (normalized.includes("bowl")) return "BOWL";
  if (normalized.includes("bat")) return "BAT";

  return "BAT";
}

function addSeconds(base: Date, seconds: number): string {
  return new Date(base.getTime() + seconds * 1000).toISOString();
}

async function getServerNow(): Promise<Date> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.rpc("server_now");

  if (error || !data) {
    return new Date();
  }

  if (typeof data === "string") {
    return new Date(data);
  }

  if (Array.isArray(data) && typeof data[0] === "string") {
    return new Date(data[0]);
  }

  return new Date();
}

async function getOrCreateAuctionState(): Promise<AuctionStateRecord> {
  const supabase = getSupabaseServerClient();

  const { data: existing, error: existingError } = await supabase
    .from("auction_state")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    return existing as AuctionStateRecord;
  }

  const { data: created, error: createError } = await supabase
    .from("auction_state")
    .insert({ status: "waiting", current_bid: 0 })
    .select("*")
    .single();

  if (createError || !created) {
    throw new Error(createError?.message ?? "Unable to create auction state row.");
  }

  return created as AuctionStateRecord;
}

async function getNextUnsoldPlayer(currentPlayerId?: string | null): Promise<PlayerRecord | null> {
  const supabase = getSupabaseServerClient();

  const [{ data: players, error: playersError }, { data: soldRows, error: soldError }] =
    await Promise.all([
      supabase
        .from("players")
        .select(
          "id, name, nationality, role, base_price, ais, batting, bowling, fielding, leadership, image_path",
        )
        .order("name", { ascending: true }),
      supabase.from("squads").select("player_id"),
    ]);

  if (playersError) {
    throw new Error(playersError.message);
  }

  if (soldError) {
    throw new Error(soldError.message);
  }

  const orderedPlayers = (players ?? []) as PlayerRecord[];
  const soldIds = new Set((soldRows ?? []).map((row) => row.player_id));

  if (!currentPlayerId) {
    for (const player of orderedPlayers) {
      if (!soldIds.has(player.id)) {
        return player;
      }
    }
    return null;
  }

  const currentIndex = orderedPlayers.findIndex((player) => player.id === currentPlayerId);
  if (currentIndex < 0) {
    for (const player of orderedPlayers) {
      if (!soldIds.has(player.id)) {
        return player;
      }
    }
    return null;
  }

  for (let i = currentIndex + 1; i < orderedPlayers.length; i += 1) {
    const player = orderedPlayers[i];
    if (!soldIds.has(player.id)) {
      return player;
    }
  }

  return null;
}

export async function startAuction(): Promise<ActionResult<AuctionStateRecord>> {
  try {
    const supabase = getSupabaseServerClient();
    const state = await getOrCreateAuctionState();
    const now = await getServerNow();

    let currentPlayerId = state.current_player_id;
    let currentBid = asNumber(state.current_bid);

    if (currentPlayerId) {
      const { data: existingSquadRow } = await supabase
        .from("squads")
        .select("id")
        .eq("player_id", currentPlayerId)
        .maybeSingle();

      if (state.status === "assigned" || existingSquadRow) {
        currentPlayerId = null;
        currentBid = 0;
      }
    }

    if (!currentPlayerId) {
      const nextPlayer = await getNextUnsoldPlayer();
      if (!nextPlayer) {
        const { data: completed, error: completeError } = await supabase
          .from("auction_state")
          .update({
            status: "completed",
            current_player_id: null,
            current_bid: 0,
            current_leader_device_id: null,
            timer_end: null,
          })
          .eq("id", state.id)
          .select("*")
          .single();

        if (completeError || !completed) {
          throw new Error(completeError?.message ?? "Unable to mark auction completed.");
        }

        return {
          ok: true,
          message: "Auction completed. No players left.",
          data: completed as AuctionStateRecord,
        };
      }

      currentPlayerId = nextPlayer.id;
      currentBid = asNumber(nextPlayer.base_price);
    }

    const { data: updated, error: updateError } = await supabase
      .from("auction_state")
      .update({
        status: "running",
        current_player_id: currentPlayerId,
        current_bid: currentBid,
        current_leader_device_id: null,
        timer_end: addSeconds(now, AUCTION_START_TIMER_SECONDS),
      })
      .eq("id", state.id)
      .select("*")
      .single();

    if (updateError || !updated) {
      throw new Error(updateError?.message ?? "Unable to start auction.");
    }

    return {
      ok: true,
      message: "Auction started.",
      data: updated as AuctionStateRecord,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unknown error while starting auction.",
    };
  }
}

export async function placeBid(device_id: string, amount: number): Promise<ActionResult> {
  try {
    const supabase = getSupabaseServerClient();
    const bidAmount = asNumber(amount);

    if (!device_id) {
      throw new Error("Device id is required.");
    }

    if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
      throw new Error("Bid amount must be a positive number.");
    }

    const { data: device, error: deviceError } = await supabase
      .from("devices")
      .select("id, role, franchise, active")
      .eq("id", device_id)
      .single();

    if (deviceError || !device) {
      throw new Error(deviceError?.message ?? "Device not found.");
    }

    const typedDevice = device as DeviceRow;
    if (!typedDevice.active) {
      throw new Error("Device is inactive.");
    }
    if (typedDevice.role !== "auction") {
      throw new Error("Only auction devices can place bids.");
    }
    if (!typedDevice.franchise) {
      throw new Error("Auction device has no franchise assigned.");
    }

    const state = await getOrCreateAuctionState();
    if (state.status !== "running") {
      throw new Error("Auction is not currently running.");
    }
    if (!state.current_player_id) {
      throw new Error("No active player to bid on.");
    }
    if (bidAmount <= asNumber(state.current_bid)) {
      throw new Error("Bid must be greater than current bid.");
    }

    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("id, franchise, purse, device_id")
      .eq("franchise", typedDevice.franchise)
      .single();

    if (teamError || !team) {
      throw new Error(teamError?.message ?? "Team not found.");
    }

    const typedTeam = team as TeamRow;
    if (asNumber(typedTeam.purse) < bidAmount) {
      throw new Error("Insufficient purse for this bid.");
    }

    const { error: bidError } = await supabase.from("bids").insert({
      player_id: state.current_player_id,
      device_id,
      amount: bidAmount,
    });

    if (bidError) {
      throw new Error(bidError.message);
    }

    const now = await getServerNow();
    const { error: updateError } = await supabase
      .from("auction_state")
      .update({
        current_bid: bidAmount,
        current_leader_device_id: device_id,
        timer_end: addSeconds(now, AUCTION_BID_TIMER_SECONDS),
      })
      .eq("id", state.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return { ok: true, message: "Bid placed successfully." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unknown error while placing bid.",
    };
  }
}

export async function pauseAuction(): Promise<ActionResult> {
  try {
    const supabase = getSupabaseServerClient();
    const state = await getOrCreateAuctionState();

    if (state.status !== "running") {
      throw new Error("Auction can only be paused from running state.");
    }

    const { error } = await supabase
      .from("auction_state")
      .update({
        status: "paused",
      })
      .eq("id", state.id);

    if (error) {
      throw new Error(error.message);
    }

    return { ok: true, message: "Auction paused." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unknown error while pausing auction.",
    };
  }
}

export async function resumeAuction(): Promise<ActionResult> {
  try {
    const supabase = getSupabaseServerClient();
    const state = await getOrCreateAuctionState();

    if (state.status !== "paused") {
      throw new Error("Auction is not paused.");
    }

    const now = await getServerNow();
    const { error } = await supabase
      .from("auction_state")
      .update({
        status: "running",
        timer_end: addSeconds(now, AUCTION_BID_TIMER_SECONDS),
      })
      .eq("id", state.id);

    if (error) {
      throw new Error(error.message);
    }

    return { ok: true, message: "Auction resumed." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unknown error while resuming auction.",
    };
  }
}

export async function assignPlayerToWinner(): Promise<ActionResult> {
  try {
    const supabase = getSupabaseServerClient();
    const state = await getOrCreateAuctionState();

    if (!state.current_player_id) {
      throw new Error("No current player available.");
    }

    if (!state.current_leader_device_id) {
      const { error: clearError } = await supabase
        .from("auction_state")
        .update({
          status: "waiting",
          current_player_id: null,
          current_bid: 0,
          current_leader_device_id: null,
          timer_end: null,
        })
        .eq("id", state.id);

      if (clearError) {
        throw new Error(clearError.message);
      }

      return { ok: true, message: "No bids. Player marked unsold." };
    }

    const { data: leaderDevice, error: leaderError } = await supabase
      .from("devices")
      .select("id, role, franchise, active")
      .eq("id", state.current_leader_device_id)
      .single();

    if (leaderError || !leaderDevice) {
      throw new Error(leaderError?.message ?? "Winning device not found.");
    }

    const typedLeader = leaderDevice as DeviceRow;
    if (!typedLeader.franchise) {
      throw new Error("Winning device has no franchise.");
    }

    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("id, franchise, purse")
      .eq("franchise", typedLeader.franchise)
      .single();

    if (teamError || !team) {
      throw new Error(teamError?.message ?? "Winning team not found.");
    }

    const purse = asNumber(team.purse);
    const finalPrice = asNumber(state.current_bid);
    if (purse < finalPrice) {
      throw new Error("Winning team purse is insufficient for assignment.");
    }

    const { error: squadInsertError } = await supabase.from("squads").insert({
      franchise: typedLeader.franchise,
      player_id: state.current_player_id,
      price: finalPrice,
    });

    if (squadInsertError) {
      throw new Error(squadInsertError.message);
    }

    const { error: purseUpdateError } = await supabase
      .from("teams")
      .update({
        purse: round2(purse - finalPrice),
      })
      .eq("franchise", typedLeader.franchise);

    if (purseUpdateError) {
      throw new Error(purseUpdateError.message);
    }

    const { error: stateUpdateError } = await supabase
      .from("auction_state")
      .update({
        status: "assigned",
        timer_end: null,
      })
      .eq("id", state.id);

    if (stateUpdateError) {
      throw new Error(stateUpdateError.message);
    }

    return {
      ok: true,
      message: `Player assigned to ${typedLeader.franchise} for ${finalPrice} Cr.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unknown error while assigning player.",
    };
  }
}

export async function nextPlayer(): Promise<ActionResult<AuctionStateRecord>> {
  try {
    const supabase = getSupabaseServerClient();
    const state = await getOrCreateAuctionState();
    const next = await getNextUnsoldPlayer(state.current_player_id);

    if (!next) {
      const { data: completed, error: completeError } = await supabase
        .from("auction_state")
        .update({
          status: "completed",
          current_player_id: null,
          current_bid: 0,
          current_leader_device_id: null,
          timer_end: null,
        })
        .eq("id", state.id)
        .select("*")
        .single();

      if (completeError || !completed) {
        throw new Error(completeError?.message ?? "Unable to mark completion.");
      }

      return {
        ok: true,
        message: "Auction completed. All players have been processed.",
        data: completed as AuctionStateRecord,
      };
    }

    const now = await getServerNow();
    const { data: updated, error: updateError } = await supabase
      .from("auction_state")
      .update({
        status: "running",
        current_player_id: next.id,
        current_bid: asNumber(next.base_price),
        current_leader_device_id: null,
        timer_end: addSeconds(now, AUCTION_START_TIMER_SECONDS),
      })
      .eq("id", state.id)
      .select("*")
      .single();

    if (updateError || !updated) {
      throw new Error(updateError?.message ?? "Unable to move to next player.");
    }

    return {
      ok: true,
      message: `Next player: ${next.name}`,
      data: updated as AuctionStateRecord,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unknown error while selecting next player.",
    };
  }
}

export async function resetAuction(): Promise<ActionResult> {
  try {
    const supabase = getSupabaseServerClient();
    const state = await getOrCreateAuctionState();

    const [bidsDelete, squadsDelete, evalDelete, teamsReset, stateReset] = await Promise.all([
      supabase.from("bids").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      supabase.from("squads").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      supabase
        .from("evaluation_results")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"),
      supabase.from("teams").update({ purse: TEAM_PURSE_CR }).in("franchise", [...FRANCHISES]),
      supabase
        .from("auction_state")
        .update({
          status: "waiting",
          current_player_id: null,
          current_bid: 0,
          current_leader_device_id: null,
          timer_end: null,
        })
        .eq("id", state.id),
    ]);

    const errors = [
      bidsDelete.error,
      squadsDelete.error,
      evalDelete.error,
      teamsReset.error,
      stateReset.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      throw new Error(errors[0]?.message ?? "Reset failed.");
    }

    return { ok: true, message: "Auction reset completed." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unknown error while resetting auction.",
    };
  }
}

export async function computeEvaluationResults(): Promise<ActionResult<EvalRow[]>> {
  try {
    const supabase = getSupabaseServerClient();

    const [{ data: squadsRaw, error: squadsError }, { data: teamsRaw, error: teamsError }] =
      await Promise.all([
        supabase
          .from("squads")
          .select("franchise, price, players:player_id (id, name, role, ais)")
          .order("franchise", { ascending: true }),
        supabase.from("teams").select("franchise, purse"),
      ]);

    if (squadsError) throw new Error(squadsError.message);
    if (teamsError) throw new Error(teamsError.message);

    const squads = (squadsRaw ?? []) as unknown as SquadPlayerJoin[];
    const teams = (teamsRaw ?? []) as Array<{ franchise: Franchise; purse: number | string }>;
    const purseByFranchise = new Map(teams.map((team) => [team.franchise, asNumber(team.purse)]));

    const results: EvalRow[] = [];

    for (const franchise of FRANCHISES) {
      const squadRows = squads.filter((row) => row.franchise === franchise && row.players);
      const players = squadRows
        .map((row) => {
          const player = Array.isArray(row.players) ? row.players[0] : row.players;
          if (!player) return null;
          return {
            ...player,
            price: asNumber(row.price),
            ais: asNumber(player.ais),
            normalizedRole: normalizeRole(player.role ?? "BAT"),
          };
        })
        .filter((player): player is NonNullable<typeof player> => Boolean(player))
        .sort((a, b) => b.ais - a.ais);

      const byRole = {
        WK: players.filter((p) => p.normalizedRole === "WK"),
        BAT: players.filter((p) => p.normalizedRole === "BAT"),
        BOWL: players.filter((p) => p.normalizedRole === "BOWL"),
        AR: players.filter((p) => p.normalizedRole === "AR"),
      };

      const selected: Array<(typeof players)[number]> = [];
      const selectedIds = new Set<string>();
      let penalties = 0;

      const mandatory: Array<{ role: keyof typeof byRole; count: number }> = [
        { role: "WK", count: 1 },
        { role: "BAT", count: 3 },
        { role: "BOWL", count: 3 },
        { role: "AR", count: 1 },
      ];

      for (const item of mandatory) {
        const pool = byRole[item.role].filter((player) => !selectedIds.has(player.id));
        const picked = pool.slice(0, item.count);

        picked.forEach((player) => {
          selected.push(player);
          selectedIds.add(player.id);
        });

        const missing = item.count - picked.length;
        if (missing > 0) {
          penalties += missing * 10;
        }
      }

      const remainingSlots = 11 - selected.length;
      if (remainingSlots > 0) {
        const filler = players.filter((player) => !selectedIds.has(player.id)).slice(0, remainingSlots);
        filler.forEach((player) => {
          selected.push(player);
          selectedIds.add(player.id);
        });
      }

      const totalMissingForXI = 11 - selected.length;
      if (totalMissingForXI > 0) {
        penalties += totalMissingForXI * 8;
      }

      const baseScore = round2(selected.reduce((sum, player) => sum + player.ais, 0));

      let balanceBonus = 0;
      if (byRole.WK.length >= 2) balanceBonus += 3;
      if (byRole.BAT.length >= 5) balanceBonus += 3;
      if (byRole.BOWL.length >= 5) balanceBonus += 3;
      if (byRole.AR.length >= 3) balanceBonus += 3;

      const purse = purseByFranchise.get(franchise) ?? TEAM_PURSE_CR;
      const spent = round2(TEAM_PURSE_CR - purse);

      let budgetBonus = 0;
      if (spent >= 85 && spent <= TEAM_PURSE_CR) budgetBonus = 10;
      else if (spent >= 75) budgetBonus = 6;
      else if (spent > 0) budgetBonus = 3;

      if (spent > TEAM_PURSE_CR) {
        penalties += round2((spent - TEAM_PURSE_CR) * 5);
      }

      if (players.length < 18) {
        penalties += (18 - players.length) * 2;
      }

      const bonus = round2(balanceBonus + budgetBonus);
      const efficiency = spent > 0 ? round2((baseScore / spent) * 10) : 0;
      const finalScore = round2(baseScore + bonus + efficiency - penalties);

      results.push({
        franchise,
        base_score: baseScore,
        bonus,
        efficiency,
        penalties: round2(penalties),
        final_score: finalScore,
      });
    }

    const { error: upsertError } = await supabase
      .from("evaluation_results")
      .upsert(results, { onConflict: "franchise" });

    if (upsertError) {
      throw new Error(upsertError.message);
    }

    const sorted = [...results].sort((a, b) => b.final_score - a.final_score);

    return {
      ok: true,
      message: "Evaluation computed successfully.",
      data: sorted,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unknown error while evaluating squads.",
    };
  }
}
