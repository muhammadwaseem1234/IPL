"use client";

import { useEffect, useMemo, useState } from "react";

import { useAuctionData } from "@/hooks/useAuctionData";
import { ensureDeviceRegistration, type DeviceSession } from "@/lib/deviceGuard";

export default function PlayerBasePage() {
  const { snapshot, loading, error, realtimeConnected } = useAuctionData();
  const [deviceSession, setDeviceSession] = useState<DeviceSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [query, setQuery] = useState("");

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

  const filteredPlayers = useMemo(() => {
    const allPlayers = snapshot?.players ?? [];
    const term = query.trim().toLowerCase();
    if (!term) return allPlayers;
    return allPlayers.filter(
      (player) =>
        player.name.toLowerCase().includes(term) || player.role.toLowerCase().includes(term),
    );
  }, [snapshot?.players, query]);

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white px-4 py-6 md:px-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <header className="feature-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-4xl font-display">Player Base</h1>
              <p className="text-slate-300 text-sm">
                Troubleshooting Dataset | Realtime: {realtimeConnected ? "Connected" : "Reconnecting"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">Total Players</p>
              <p className="text-2xl font-display text-orange-400">{snapshot?.players.length ?? 0}</p>
            </div>
          </div>
        </header>

        <section className="feature-card">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or role..."
            className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-slate-400 outline-none focus:border-orange-400"
          />
        </section>

        {loading ? <p className="text-slate-300">Loading...</p> : null}
        {error ? <p className="text-red-400">{error}</p> : null}

        <section className="feature-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-white/10">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Role</th>
                <th className="py-2 pr-3">Base Price</th>
                <th className="py-2 pr-3">AIS</th>
                <th className="py-2 pr-3">BAT</th>
                <th className="py-2 pr-3">BOWL</th>
                <th className="py-2 pr-3">FIELD</th>
                <th className="py-2 pr-3">LEAD</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player) => (
                <tr key={player.id} className="border-b border-white/5">
                  <td className="py-2 pr-3">{player.name}</td>
                  <td className="py-2 pr-3">{player.role}</td>
                  <td className="py-2 pr-3">{player.base_price}</td>
                  <td className="py-2 pr-3">{player.ais}</td>
                  <td className="py-2 pr-3">{player.batting}</td>
                  <td className="py-2 pr-3">{player.bowling}</td>
                  <td className="py-2 pr-3">{player.fielding}</td>
                  <td className="py-2 pr-3">{player.leadership}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
