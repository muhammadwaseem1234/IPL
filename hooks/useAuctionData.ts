"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchAuctionSnapshot, type AuctionSnapshot } from "@/lib/auctionClient";
import { useAuctionRealtime } from "@/hooks/useAuctionRealtime";

export function useAuctionData() {
  const [snapshot, setSnapshot] = useState<AuctionSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchAuctionSnapshot();
      setSnapshot(data);
      setError(null);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Unable to fetch data.");
    } finally {
      setLoading(false);
    }
  }, []);

  const { connected } = useAuctionRealtime(() => {
    void refresh();
  });

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refresh();
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refresh]);

  return {
    snapshot,
    loading,
    error,
    refresh,
    realtimeConnected: connected,
  };
}
