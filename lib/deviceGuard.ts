"use client";

import type { Franchise } from "@/lib/constants";
import type { DeviceRole } from "@/lib/types";

export const DEVICE_STORAGE_KEY = "device_id";

export type DeviceSession = {
  allowed: boolean;
  deviceId: string;
  role: DeviceRole | null;
  franchise: Franchise | null;
  reason: string | null;
};

type RegisterDeviceResponse = {
  ok: boolean;
  allowed: boolean;
  reason?: string;
  device: {
    id: string;
    role: DeviceRole;
    franchise: Franchise | null;
  } | null;
};

function getOrCreateFingerprint(): string {
  const existing = window.localStorage.getItem(DEVICE_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const generated = crypto.randomUUID();
  window.localStorage.setItem(DEVICE_STORAGE_KEY, generated);
  return generated;
}

export async function ensureDeviceRegistration(): Promise<DeviceSession> {
  const fingerprint = getOrCreateFingerprint();

  const response = await fetch("/api/devices/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fingerprint }),
  });

  let payload: RegisterDeviceResponse | null = null;
  try {
    payload = (await response.json()) as RegisterDeviceResponse;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.ok || !payload.device) {
    return {
      allowed: false,
      deviceId: fingerprint,
      role: null,
      franchise: null,
      reason: payload?.reason ?? "Device registration failed.",
    };
  }

  return {
    allowed: payload.allowed,
    deviceId: payload.device.id,
    role: payload.device.role,
    franchise: payload.device.franchise,
    reason: payload.reason ?? null,
  };
}
