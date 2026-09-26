// One browser = one customer device identity. The home referral card and the request page used
// different localStorage keys, which gave one browser two identities: referral attribution landed
// on one and request ownership on the other. Both now use this single id.
const DEVICE_KEY = "life_help_referral_device_id";
const LEGACY_REQUEST_PAGE_KEY = "life_help_public_identity_device";

export function getCustomerDeviceId(): string {
  const existing = window.localStorage.getItem(DEVICE_KEY);
  if (existing) return existing;
  // Keep a browser that so far only visited the request page on the identity it already owns.
  const value = window.localStorage.getItem(LEGACY_REQUEST_PAGE_KEY) || `device-${crypto.randomUUID()}`;
  window.localStorage.setItem(DEVICE_KEY, value);
  return value;
}

/** A referrer's public ID from ?ref= (display/referral only; never an ownership input). */
export function getReferralParam(): string | undefined {
  const ref = new URLSearchParams(window.location.search).get("ref");
  return ref && /^[A-Z]{8}$/.test(ref) ? ref : undefined;
}
