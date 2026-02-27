"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { useAuctionData } from "@/hooks/useAuctionData";
import { ensureDeviceRegistration, type DeviceSession } from "@/lib/deviceGuard";
import { postAuctionAction } from "@/lib/auctionClient";

export default function AuctionPage() {
  const { snapshot, loading, error, refresh, realtimeConnected } = useAuctionData();
  const [deviceSession, setDeviceSession] = useState<DeviceSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [selectedIncrement, setSelectedIncrement] = useState(1);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const session = await ensureDeviceRegistration();
      if (mounted) {
        setDeviceSession(session);
        setSessionLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const auctionState = snapshot?.auction_state ?? null;
  const currentBid = auctionState?.current_bid ?? 0;
  const proposedBid = currentBid + selectedIncrement;
  const currentPlayer = snapshot?.current_player ?? null;

  const myTeam =
    snapshot && deviceSession?.franchise
      ? snapshot.teams.find((team) => team.franchise === deviceSession.franchise) ?? null
      : null;

  const mySquad =
    snapshot && deviceSession?.franchise
      ? snapshot.squads.filter((item) => item.franchise === deviceSession.franchise)
      : [];

  async function confirmBid() {
    if (!deviceSession || !currentPlayer) return;
    setSubmitting(true);
    const result = await postAuctionAction({
      action: "placeBid",
      deviceId: deviceSession.deviceId,
      amount: proposedBid,
    });
    setActionMessage(result.message);
    await refresh();
    setSubmitting(false);
  }

  if (sessionLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-4">
        <p className="text-slate-300">Registering device...</p>
      </main>
    );
  }

  if (!deviceSession?.allowed) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-4">
        <div className="max-w-xl mx-auto feature-card mt-16">
          <h1 className="text-3xl font-display text-white">Device Rejected</h1>
          <p className="text-slate-300 mt-3">{deviceSession?.reason ?? "Device limit exceeded."}</p>
        </div>
      </main>
    );
  }

  if (deviceSession.role !== "auction") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-4">
        <div className="max-w-xl mx-auto feature-card mt-16">
          <h1 className="text-3xl font-display text-white">Auction Access Only</h1>
          <p className="text-slate-300 mt-3">
            This device is locked as <strong>{deviceSession.role}</strong>.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white px-4 py-6 md:px-8">
      <div className="max-w-5xl mx-auto space-y-4">
        <header className="feature-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-4xl font-display">Auction Console</h1>
              <p className="text-slate-300 text-sm mt-1">
                Franchise: {deviceSession.franchise} | Realtime:{" "}
                {realtimeConnected ? "Connected" : "Reconnecting"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">Timer</p>
              <p className="text-3xl font-display text-orange-400">
                {snapshot?.remaining_seconds ?? 0}s
              </p>
            </div>
          </div>
        </header>

        {error ? <p className="text-red-400">{error}</p> : null}
        {actionMessage ? <p className="text-green-400">{actionMessage}</p> : null}

        <section className="grid gap-4 md:grid-cols-2">
          <article className="feature-card">
            <h2 className="text-2xl font-display mb-3">Current Player</h2>
            {loading ? <p className="text-slate-300">Loading auction feed...</p> : null}
            {!loading && !currentPlayer ? (
              <p className="text-slate-300">No active player right now.</p>
            ) : null}
            {currentPlayer ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Image
                    src={currentPlayer.image_path ?? "/file.svg"}
                    alt={currentPlayer.name}
                    width={72}
                    height={72}
                    className="rounded-xl object-cover border border-white/20"
                  />
                  <div>
                    <p className="text-xl font-semibold">{currentPlayer.name}</p>
                    <p className="text-slate-300 text-sm">
                      {currentPlayer.role} | AIS {currentPlayer.ais}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="stat-card">
                    <p className="text-slate-400 text-xs">Base Price</p>
                    <p className="text-xl font-display">{currentPlayer.base_price} Cr</p>
                  </div>
                  <div className="stat-card">
                    <p className="text-slate-400 text-xs">Current Bid</p>
                    <p className="text-xl font-display text-orange-400">{currentBid} Cr</p>
                  </div>
                </div>
              </div>
            ) : null}
          </article>

          <article className="feature-card">
            <h2 className="text-2xl font-display mb-3">Bid Controls</h2>
            <div className="grid grid-cols-3 gap-2">
              {[1, 3, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedIncrement(value)}
                  className={`px-3 py-3 rounded-xl border text-lg font-semibold ${
                    selectedIncrement === value
                      ? "bg-orange-500 border-orange-400 text-white"
                      : "bg-white/5 border-white/20 text-slate-200"
                  }`}
                >
                  +{value} CR
                </button>
              ))}
            </div>

            <div className="mt-4 stat-card">
              <p className="text-slate-400 text-xs">Confirm Amount</p>
              <p className="text-3xl font-display text-orange-400">{proposedBid} Cr</p>
            </div>

            <button
              type="button"
              onClick={confirmBid}
              disabled={submitting || !currentPlayer || auctionState?.status !== "running"}
              className="w-full mt-4 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Confirm Bid"}
            </button>
          </article>
        </section>

        <section className="feature-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl font-display">Current Squad</h2>
            <p className="text-slate-300 text-sm">Purse: {myTeam?.purse ?? 0} Cr</p>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {mySquad.length === 0 ? <p className="text-slate-400">No players acquired yet.</p> : null}
            {mySquad.map((entry) => (
              <div key={entry.id} className="stat-card">
                <p className="font-semibold">{entry.players?.name ?? "Unknown player"}</p>
                <p className="text-slate-400 text-sm">
                  {entry.players?.role ?? "-"} | Price {entry.price} Cr
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
