"use client";

import { useEffect, useRef, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const TABLES = ["auction_state", "bids", "teams", "squads"] as const;

type AuctionRealtimeTable = (typeof TABLES)[number];

type AuctionRealtimeCallback = (table: AuctionRealtimeTable) => void;

export function useAuctionRealtime(onChange?: AuctionRealtimeCallback) {
  const [connected, setConnected] = useState(false);
  const callbackRef = useRef<AuctionRealtimeCallback | undefined>(onChange);

  useEffect(() => {
    callbackRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase.channel(`auction-realtime-${crypto.randomUUID()}`);

    TABLES.forEach((table) => {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          callbackRef.current?.(table);
        },
      );
    });

    channel.subscribe((status) => {
      setConnected(status === "SUBSCRIBED");
    });

    return () => {
      setConnected(false);
      void supabase.removeChannel(channel);
    };
  }, []);

  return { connected };
}
