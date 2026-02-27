import { NextResponse } from "next/server";

import { DEVICE_LIMIT, FRANCHISES } from "@/lib/constants";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { DeviceRole } from "@/lib/types";

type RegisterBody = {
  fingerprint?: string;
};

function roleBySlot(slot: number): DeviceRole {
  if (slot === 1) return "admin";
  if (slot === 2) return "view";
  if (slot >= 3 && slot <= 12) return "auction";
  return "backup";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as RegisterBody;
  const fingerprint = body.fingerprint?.trim();

  if (!fingerprint) {
    return NextResponse.json(
      {
        ok: false,
        allowed: false,
        reason: "Missing fingerprint.",
        device: null,
      },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServerClient();

  const { data: existingDevice, error: existingError } = await supabase
    .from("devices")
    .select("id, role, franchise")
    .eq("fingerprint", fingerprint)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json(
      {
        ok: false,
        allowed: false,
        reason: existingError.message,
        device: null,
      },
      { status: 500 },
    );
  }

  if (existingDevice) {
    await supabase
      .from("devices")
      .update({
        connected_at: new Date().toISOString(),
        active: true,
      })
      .eq("id", existingDevice.id);

    return NextResponse.json({
      ok: true,
      allowed: true,
      device: {
        id: existingDevice.id,
        role: existingDevice.role,
        franchise: existingDevice.franchise,
      },
    });
  }

  const { count, error: countError } = await supabase
    .from("devices")
    .select("id", { count: "exact", head: true })
    .eq("active", true);

  if (countError) {
    return NextResponse.json(
      {
        ok: false,
        allowed: false,
        reason: countError.message,
        device: null,
      },
      { status: 500 },
    );
  }

  const slot = (count ?? 0) + 1;
  if (slot > DEVICE_LIMIT) {
    return NextResponse.json(
      {
        ok: true,
        allowed: false,
        reason: "Device limit reached (max 13).",
        device: null,
      },
      { status: 403 },
    );
  }

  const role = roleBySlot(slot);
  let franchise: string | null = null;

  if (role === "auction") {
    const { data: assignedTeams, error: assignedTeamsError } = await supabase
      .from("devices")
      .select("franchise")
      .eq("role", "auction")
      .eq("active", true)
      .not("franchise", "is", null);

    if (assignedTeamsError) {
      return NextResponse.json(
        {
          ok: false,
          allowed: false,
          reason: assignedTeamsError.message,
          device: null,
        },
        { status: 500 },
      );
    }

    const used = new Set((assignedTeams ?? []).map((item) => item.franchise));
    const available = FRANCHISES.filter((team) => !used.has(team));

    if (available.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          allowed: false,
          reason: "No franchise available for this auction device.",
          device: null,
        },
        { status: 500 },
      );
    }

    const randomIndex = Math.floor(Math.random() * available.length);
    franchise = available[randomIndex];
  }

  const { data: insertedDevice, error: insertError } = await supabase
    .from("devices")
    .insert({
      fingerprint,
      role,
      franchise,
      connected_at: new Date().toISOString(),
      active: true,
    })
    .select("id, role, franchise")
    .single();

  if (insertError || !insertedDevice) {
    return NextResponse.json(
      {
        ok: false,
        allowed: false,
        reason: insertError?.message ?? "Device insert failed.",
        device: null,
      },
      { status: 500 },
    );
  }

  if (insertedDevice.role === "auction" && insertedDevice.franchise) {
    const { error: teamLinkError } = await supabase
      .from("teams")
      .update({ device_id: insertedDevice.id })
      .eq("franchise", insertedDevice.franchise);

    if (teamLinkError) {
      return NextResponse.json(
        {
          ok: false,
          allowed: false,
          reason: teamLinkError.message,
          device: null,
        },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    ok: true,
    allowed: true,
    device: {
      id: insertedDevice.id,
      role: insertedDevice.role,
      franchise: insertedDevice.franchise,
    },
  });
}
