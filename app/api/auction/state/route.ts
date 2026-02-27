import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabaseServer";

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

async function getServerNow(): Promise<Date> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.rpc("server_now");
  if (error || !data) return new Date();

  if (typeof data === "string") return new Date(data);
  if (Array.isArray(data) && typeof data[0] === "string") return new Date(data[0]);
  return new Date();
}

export async function GET() {
  const supabase = getSupabaseServerClient();

  const [
    { data: auctionStateRows, error: stateError },
    { data: teams, error: teamsError },
    { data: squads, error: squadsError },
    { data: players, error: playersError },
    { data: evaluationResults, error: evalError },
  ] = await Promise.all([
    supabase.from("auction_state").select("*").order("updated_at", { ascending: false }).limit(1),
    supabase.from("teams").select("*").order("franchise", { ascending: true }),
    supabase
      .from("squads")
      .select(
        "id, franchise, player_id, price, players:player_id (id, name, nationality, role, ais, image_path)",
      )
      .order("franchise", { ascending: true }),
    supabase
      .from("players")
      .select(
        "id, name, nationality, role, base_price, ais, batting, bowling, fielding, leadership, image_path",
      )
      .order("name", { ascending: true }),
    supabase.from("evaluation_results").select("*").order("final_score", { ascending: false }),
  ]);

  if (stateError || teamsError || squadsError || playersError || evalError) {
    return NextResponse.json(
      {
        ok: false,
        message:
          stateError?.message ??
          teamsError?.message ??
          squadsError?.message ??
          playersError?.message ??
          evalError?.message ??
          "Failed to fetch auction state.",
      },
      { status: 500 },
    );
  }

  const auctionState = auctionStateRows?.[0] ?? null;
  const currentPlayer =
    auctionState?.current_player_id != null
      ? (players ?? []).find((player) => player.id === auctionState.current_player_id) ?? null
      : null;

  const now = await getServerNow();
  const timerEnd = auctionState?.timer_end ? new Date(auctionState.timer_end) : null;
  const remainingSeconds = timerEnd ? Math.max(0, Math.floor((timerEnd.getTime() - now.getTime()) / 1000)) : 0;

  const soldPlayerIds = new Set((squads ?? []).map((row) => row.player_id));
  const unsoldPlayers = (players ?? []).filter((player) => !soldPlayerIds.has(player.id));

  return NextResponse.json({
    ok: true,
    data: {
      server_now: now.toISOString(),
      remaining_seconds: remainingSeconds,
      auction_state: auctionState
        ? {
            ...auctionState,
            current_bid: toNumber(auctionState.current_bid),
          }
        : null,
      current_player: currentPlayer
        ? {
            ...currentPlayer,
            base_price: toNumber(currentPlayer.base_price),
            ais: toNumber(currentPlayer.ais),
            batting: toNumber(currentPlayer.batting),
            bowling: toNumber(currentPlayer.bowling),
            fielding: toNumber(currentPlayer.fielding),
            leadership: toNumber(currentPlayer.leadership),
          }
        : null,
      teams: (teams ?? []).map((team) => ({
        ...team,
        purse: toNumber(team.purse),
      })),
      squads: (squads ?? []).map((row) => {
        const joinedPlayer = Array.isArray(row.players) ? row.players[0] : row.players;
        return {
          ...row,
          price: toNumber(row.price),
          players: joinedPlayer
            ? {
                ...joinedPlayer,
                ais: toNumber(joinedPlayer.ais),
              }
            : null,
        };
      }),
      players: (players ?? []).map((player) => ({
        ...player,
        base_price: toNumber(player.base_price),
        ais: toNumber(player.ais),
        batting: toNumber(player.batting),
        bowling: toNumber(player.bowling),
        fielding: toNumber(player.fielding),
        leadership: toNumber(player.leadership),
      })),
      unsold_count: unsoldPlayers.length,
      evaluation_results: (evaluationResults ?? []).map((result) => ({
        ...result,
        base_score: toNumber(result.base_score),
        bonus: toNumber(result.bonus),
        efficiency: toNumber(result.efficiency),
        penalties: toNumber(result.penalties),
        final_score: toNumber(result.final_score),
      })),
    },
  });
}
