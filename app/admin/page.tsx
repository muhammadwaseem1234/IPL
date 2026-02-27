"use client";

import { useEffect, useState } from "react";

import { useAuctionData } from "@/hooks/useAuctionData";
import { postAuctionAction } from "@/lib/auctionClient";
import { ensureDeviceRegistration, type DeviceSession } from "@/lib/deviceGuard";

type AdminAction = "start" | "pause" | "resume" | "stop" | "next" | "reset" | "evaluate";

export default function AdminPage() {
  const { snapshot, refresh, loading, error, realtimeConnected } = useAuctionData();
  const [deviceSession, setDeviceSession] = useState<DeviceSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<AdminAction | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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

  async function executeAction(action: AdminAction) {
    if (!deviceSession) return;
    setBusyAction(action);
    const result = await postAuctionAction({
      action,
      deviceId: deviceSession.deviceId,
    });
    setMessage(result.message);
    await refresh();
    setBusyAction(null);
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

  if (deviceSession.role !== "admin") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-4">
        <div className="max-w-xl mx-auto feature-card mt-16">
          <h1 className="text-3xl font-display text-white">Admin Access Only</h1>
          <p className="text-slate-300 mt-3">
            This device is locked as <strong>{deviceSession.role}</strong>.
          </p>
        </div>
      </main>
    );
  }

  const controls: Array<{ label: string; action: AdminAction }> = [
    { label: "Start", action: "start" },
    { label: "Pause", action: "pause" },
    { label: "Resume", action: "resume" },
    { label: "Stop", action: "stop" },
    { label: "Next Player", action: "next" },
    { label: "Reset", action: "reset" },
    { label: "Evaluate", action: "evaluate" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white px-4 py-6 md:px-8">
      <div className="max-w-5xl mx-auto space-y-4">
        <header className="feature-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-4xl font-display">Admin Console</h1>
              <p className="text-slate-300 text-sm mt-1">
                Realtime: {realtimeConnected ? "Connected" : "Reconnecting"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">Status</p>
              <p className="text-2xl font-display text-orange-400">
                {snapshot?.auction_state?.status ?? "waiting"}
              </p>
            </div>
          </div>
        </header>

        {loading ? <p className="text-slate-300">Loading...</p> : null}
        {error ? <p className="text-red-400">{error}</p> : null}
        {message ? <p className="text-green-400">{message}</p> : null}

        <section className="feature-card">
          <h2 className="text-2xl font-display mb-3">Controls</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {controls.map((item) => (
  <button
    key={item.action}
    type="button"
    onClick={() => void executeAction(item.action)}
    disabled={busyAction !== null}
    className="group relative w-full h-full overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-all duration-300 hover:border-white/20"
  >
    {/* This container applies the scaling and brightness effects */}
    <div className="flex items-center justify-center w-full h-full p-4 transition-transform duration-300 group-hover:scale-110 filter brightness-100 group-hover:brightness-110 drop-shadow-2xl">
      <span className="text-white font-medium">
        {busyAction === item.action ? "..." : item.label}
      </span>
    </div>
  </button>
))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="feature-card">
            <h2 className="text-2xl font-display mb-2">Current Player</h2>
            <p className="text-slate-300">
              {snapshot?.current_player?.name ?? "No player selected"}
            </p>
            <p className="text-slate-400 text-sm">
              Current Bid: {snapshot?.auction_state?.current_bid ?? 0} Cr
            </p>
            <p className="text-slate-400 text-sm">
              Remaining Time: {snapshot?.remaining_seconds ?? 0}s
            </p>
          </article>

          <article className="feature-card">
            <h2 className="text-2xl font-display mb-2">Progress</h2>
            <p className="text-slate-300">Unsold Players: {snapshot?.unsold_count ?? 0}</p>
            <p className="text-slate-400 text-sm">Teams: {snapshot?.teams.length ?? 0}</p>
            <p className="text-slate-400 text-sm">Sold Players: {snapshot?.squads.length ?? 0}</p>
          </article>
        </section>

        <section className="feature-card">
          <h2 className="text-2xl font-display mb-3">Evaluation Table</h2>
          <div className="space-y-2">
            {snapshot?.evaluation_results.length ? null : (
              <p className="text-slate-400">No evaluation results yet. Click Evaluate.</p>
            )}
            {(snapshot?.evaluation_results ?? []).map((result, index) => (
              <div key={result.id} className="stat-card flex items-center justify-between">
                <p>
                  #{index + 1} {result.franchise}
                </p>
                <p className="font-display text-orange-400">{result.final_score.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
