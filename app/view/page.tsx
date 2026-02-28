"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

import { useAuctionData } from "@/hooks/useAuctionData";
import type { SnapshotSquad } from "@/lib/auctionClient";
import { ensureDeviceRegistration, type DeviceSession } from "@/lib/deviceGuard";

// ─── Nationality → card theme mapping ────────────────────────────────────────
const NATIONALITY_THEMES: Record<
  string,
  { from: string; via: string; to: string; glow: string; accent: string; shimmer: string }
> = {
  // Sky blue dominant, green mid, hint of orange accent
  Indian:         { from: "#0EA5E9", via: "#16A34A", to: "#0284C7", glow: "rgba(14,165,233,0.65)",  accent: "#FB923C", shimmer: "rgba(14,165,233,0.18)" },
  // Predominantly yellow, hint of green
  Australian:     { from: "#EAB308", via: "#CA8A04", to: "#16A34A", glow: "rgba(234,179,8,0.65)",   accent: "#FDE047", shimmer: "rgba(234,179,8,0.18)" },
  // Dark blue dominant, white accent
  English:        { from: "#1E3A5F", via: "#1E40AF", to: "#172554", glow: "rgba(30,58,138,0.7)",    accent: "#E2E8F0", shimmer: "rgba(226,232,240,0.1)" },
  // South African — unchanged from original
  "South African":{ from: "#007A4D", via: "#FFB81C", to: "#001489", glow: "rgba(255,184,28,0.55)",  accent: "#FFB81C", shimmer: "rgba(255,184,28,0.12)" },
  // Predominantly black, hints of white
  "New Zealander":{ from: "#0F0F0F", via: "#1C1C1C", to: "#111827", glow: "rgba(255,255,255,0.25)", accent: "#F1F5F9", shimmer: "rgba(255,255,255,0.07)" },
  // Maroon dominant, hint of white
  "West Indian":  { from: "#7B1D1D", via: "#991B1B", to: "#450A0A", glow: "rgba(153,27,27,0.7)",   accent: "#FCA5A5", shimmer: "rgba(252,165,165,0.1)" },
  // Royal blue dominant, yellow accent
  "Sri Lankan":   { from: "#1D4ED8", via: "#1E40AF", to: "#1E3A8A", glow: "rgba(29,78,216,0.65)",  accent: "#FACC15", shimmer: "rgba(250,204,21,0.14)" },
  // Predominantly green, white accent
  Pakistani:      { from: "#14532D", via: "#15803D", to: "#166534", glow: "rgba(21,128,61,0.65)",   accent: "#F0FDF4", shimmer: "rgba(240,253,244,0.08)" },
  // Sky blue dominant, red accent
  Afghan:         { from: "#0284C7", via: "#0369A1", to: "#075985", glow: "rgba(2,132,199,0.65)",   accent: "#EF4444", shimmer: "rgba(239,68,68,0.14)" },
  // Bangladeshi — unchanged
  Bangladeshi:    { from: "#006A4E", via: "#F42A41", to: "#006A4E", glow: "rgba(244,42,65,0.55)",   accent: "#F42A41", shimmer: "rgba(244,42,65,0.12)" },
  // Orange dominant, yellow accent
  Zimbabwean:     { from: "#EA580C", via: "#F97316", to: "#C2410C", glow: "rgba(234,88,12,0.65)",   accent: "#FDE047", shimmer: "rgba(253,224,71,0.14)" },
  // Singaporean — unchanged
  Singaporean:    { from: "#EF3340", via: "#FFFFFF", to: "#EF3340", glow: "rgba(239,51,64,0.55)",   accent: "#FFFFFF", shimmer: "rgba(255,255,255,0.1)" },
};

const DEFAULT_THEME = {
  from: "#374151", via: "#6B7280", to: "#1F2937",
  glow: "rgba(107,114,128,0.45)", accent: "#9CA3AF", shimmer: "rgba(156,163,175,0.1)",
};

function getTheme(nationality?: string | null) {
  if (!nationality) return DEFAULT_THEME;
  return NATIONALITY_THEMES[nationality] ?? DEFAULT_THEME;
}

// ─── Stat bar ─────────────────────────────────────────────────────────────────
function StatBar({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[10px] uppercase tracking-widest text-white/50 font-medium">{label}</span>
        <span className="text-xs font-bold" style={{ color: accent }}>{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${accent}99, ${accent})`,
            boxShadow: `0 0 6px ${accent}88`,
          }}
        />
      </div>
    </div>
  );
}

// ─── Main Player Card ─────────────────────────────────────────────────────────
interface PlayerCardProps {
  player: {
    name: string;
    nationality?: string | null;
    category?: string | null;
    role: string;
    base_price: number;
    ais: number;
    batting: number;
    bowling: number;
    fielding: number;
    leadership: number;
    image_path?: string | null;
  };
  currentBid: number;
}

function PlayerCard({ player, currentBid }: PlayerCardProps) {
  const theme = getTheme(player.nationality);
  const [glitter, setGlitter] = useState<{ x: number; y: number; id: number }[]>([]);

  // Spawn glitter particles periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const newParticles = Array.from({ length: 3 }, (_, i) => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        id: Date.now() + i,
      }));
      setGlitter((prev) => [...prev.slice(-18), ...newParticles]);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full" style={{ perspective: "1200px" }}>
      {/* Outer glow halo */}
      <div
        className="absolute inset-0 rounded-3xl blur-2xl opacity-60 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 60% 50%, ${theme.glow}, transparent 70%)`,
          transform: "scale(1.08)",
        }}
      />

      {/* Card body */}
      <div
        className="relative rounded-3xl overflow-hidden border border-white/15"
        style={{
          background: `linear-gradient(135deg, ${theme.from}dd 0%, ${theme.via}44 45%, ${theme.to}cc 100%)`,
          boxShadow: `0 0 0 1px ${theme.accent}22, 0 25px 60px -10px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
          minHeight: "220px",
        }}
      >
        {/* Shimmer overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(115deg, transparent 30%, ${theme.shimmer} 50%, transparent 70%)`,
            backgroundSize: "200% 200%",
            animation: "cardShimmer 3s ease-in-out infinite",
          }}
        />

        {/* Glitter particles */}
        {glitter.map((p) => (
          <span
            key={p.id}
            className="absolute pointer-events-none rounded-full animate-ping"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: "3px",
              height: "3px",
              background: theme.accent,
              opacity: 0.7,
              animationDuration: "1.2s",
            }}
          />
        ))}

        {/* Diagonal stripe texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-5"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, ${theme.accent} 0px, ${theme.accent} 1px, transparent 1px, transparent 12px)`,
          }}
        />

        {/* Content grid */}
        <div className="relative z-10 flex h-full">
          {/* Left — Stats */}
          <div className="flex-1 p-6 flex flex-col justify-between gap-3">
            {/* Top labels */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: `${theme.accent}22`, color: theme.accent, border: `1px solid ${theme.accent}44` }}
                >
                  {player.role}
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full font-semibold bg-white/10 text-white/80 border border-white/20">
                  {player.category ?? "Uncategorized"}
                </span>
                {player.nationality && (
                  <span className="text-[10px] uppercase tracking-widest text-white/40">
                    {player.nationality}
                  </span>
                )}
              </div>
              <h2
                className="text-3xl md:text-4xl font-display leading-tight text-white drop-shadow-lg"
                style={{ textShadow: `0 0 20px ${theme.glow}` }}
              >
                {player.name}
              </h2>
            </div>

            {/* Stat bars */}
            <div className="space-y-2.5 flex-1 justify-center flex flex-col">
              <StatBar label="Batting"    value={player.batting}    accent={theme.accent} />
              <StatBar label="Bowling"    value={player.bowling}    accent={theme.accent} />
              <StatBar label="Fielding"   value={player.fielding}   accent={theme.accent} />
              <StatBar label="Leadership" value={player.leadership} accent={theme.accent} />
            </div>

            {/* Bottom badges */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-0.5">AIS Score</p>
                <p
                  className="text-2xl font-display"
                  style={{ color: theme.accent, textShadow: `0 0 12px ${theme.glow}` }}
                >
                  {player.ais}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-0.5">Base Price</p>
                <p className="text-sm font-semibold text-white/70">{player.base_price} Cr</p>
              </div>
            </div>
          </div>

          {/* Right — Photo */}
          <div className="relative w-44 md:w-56 flex-shrink-0 flex items-end justify-center overflow-hidden">
            {/* Photo background gradient */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to left, transparent, ${theme.from}88 100%), linear-gradient(to top, ${theme.from}99 0%, transparent 60%)`,
              }}
            />
            {/* Glow behind player */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-36 h-36 rounded-full blur-3xl opacity-50 pointer-events-none"
              style={{ background: theme.glow }}
            />
            <Image
              src={player.image_path ?? "/file.svg"}
              alt={player.name}
              width={220}
              height={280}
              className="relative z-10 object-cover object-top w-full h-full"
              style={{ maskImage: "linear-gradient(to top, transparent 0%, black 25%)" }}
            />
          </div>
        </div>

        {/* Current bid banner */}
        <div
          className="relative z-10 px-6 py-3 flex items-center justify-between border-t"
          style={{
            borderColor: `${theme.accent}33`,
            background: `linear-gradient(90deg, ${theme.from}99, ${theme.to}99)`,
          }}
        >
          <span className="text-[11px] uppercase tracking-[0.25em] text-white/50">Current Bid</span>
          <span
            className="text-2xl font-display"
            style={{ color: theme.accent, textShadow: `0 0 16px ${theme.glow}` }}
          >
            {currentBid} Cr
          </span>
        </div>
      </div>

      <style>{`
        @keyframes cardShimmer {
          0%   { background-position: 200% 0; }
          50%  { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ViewPage() {
  const { snapshot, loading, error, realtimeConnected } = useAuctionData();
  const [deviceSession, setDeviceSession] = useState<DeviceSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const session = await ensureDeviceRegistration();
      if (mounted) { setDeviceSession(session); setSessionLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  const groupedSquads = useMemo(() => {
    const groups = new Map<string, SnapshotSquad[]>();
    for (const squad of snapshot?.squads ?? []) {
      const current = groups.get(squad.franchise) ?? [];
      current.push(squad);
      groups.set(squad.franchise, current);
    }
    return groups;
  }, [snapshot]);

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

  if (!["view", "admin"].includes(deviceSession.role ?? "")) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-4">
        <div className="max-w-xl mx-auto feature-card mt-16">
          <h1 className="text-3xl font-display text-white">Projector View Locked</h1>
          <p className="text-slate-300 mt-3">This route is available only for view/admin devices.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white px-4 py-6 md:px-8">
      <div className="max-w-7xl mx-auto space-y-4">

        {/* Header */}
        <header className="feature-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-4xl font-display">Projector View</h1>
              <p className="text-slate-300 text-sm">
                Realtime: {realtimeConnected ? "✦ Connected" : "↻ Reconnecting"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">Status</p>
              <p className="text-2xl font-display text-orange-400">
                {snapshot?.auction_state?.status ?? "waiting"}
              </p>
              <p className="text-slate-300 text-sm">Timer: {snapshot?.remaining_seconds ?? 0}s</p>
            </div>
          </div>
        </header>

        {loading ? <p className="text-slate-300">Loading...</p> : null}
        {error   ? <p className="text-red-400">{error}</p>         : null}

        {/* ── Prominent Player Card ── */}
        {snapshot?.current_player ? (
          <section>
            <h2 className="text-2xl font-display mb-3 text-slate-300 tracking-wide">On The Block</h2>
            <PlayerCard
              player={snapshot.current_player}
              currentBid={snapshot?.auction_state?.current_bid ?? 0}
            />
          </section>
        ) : (
          <section className="feature-card text-center py-12">
            <p className="text-2xl font-display text-slate-400">No player on block</p>
          </section>
        )}

        {/* Teams purse */}
        <section className="feature-card">
          <h2 className="text-2xl font-display mb-3">All Teams Purse</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {(snapshot?.teams ?? []).map((team) => (
              <div key={team.id} className="stat-card">
                <p className="font-display text-xl">{team.franchise}</p>
                <p className="text-slate-300">{team.purse} Cr</p>
              </div>
            ))}
          </div>
        </section>

        {/* Squads */}
        <section className="feature-card">
          <h2 className="text-2xl font-display mb-3">Squads</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {(snapshot?.teams ?? []).map((team) => {
              const squad = groupedSquads.get(team.franchise) ?? [];
              return (
                <div key={team.id} className="stat-card">
                  <h3 className="text-lg font-semibold mb-2">{team.franchise}</h3>
                  {squad.length === 0 ? <p className="text-slate-400 text-sm">No players yet.</p> : null}
                  <div className="space-y-2">
                    {squad.map((entry) => {
                      const t = getTheme(entry.players?.nationality);
                      return (
                        <div key={entry.id} className="flex items-center gap-2">
                          <div
                            className="rounded-md overflow-hidden flex-shrink-0"
                            style={{ boxShadow: `0 0 8px ${t.glow}` }}
                          >
                            <Image
                              src={entry.players?.image_path ?? "/file.svg"}
                              alt={entry.players?.name ?? "Unknown player"}
                              width={30}
                              height={30}
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="text-sm text-slate-300">
                              {entry.players?.name ?? "Unknown"}{" "}
                              <span style={{ color: t.accent }}>({entry.price} Cr)</span>
                            </p>
                            <p className="text-xs text-white/40">{entry.players?.nationality ?? "Unknown"}</p>
                            <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.15em] font-semibold bg-white/10 text-white/80 border border-white/20">
                              {entry.players?.category ?? "Uncategorized"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
