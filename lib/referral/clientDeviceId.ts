"use client";

const DEVICE_KEY = "life_help_referral_device_id";
const LEGACY_KEY = "life_help_public_identity_device";

export function getCustomerDeviceId(): string {
  if (typeof window === "undefined") return "server-identity";
  const existing = window.localStorage.getItem(DEVICE_KEY);
  if (existing) return existing;
  const legacy = window.localStorage.getItem(LEGACY_KEY);
  const value = legacy || `device-${crypto.randomUUID()}`;
  window.localStorage.setItem(DEVICE_KEY, value);
  return value;
}

export function getReferralParam(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const ref = new URLSearchParams(window.location.search).get("ref");
  return ref && /^[A-Z0-9-]{4,20}$/i.test(ref) ? ref.toUpperCase() : undefined;
}
