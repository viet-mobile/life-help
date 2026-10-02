"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { learnConfig } from "@/lib/learn/config";
import type { Site } from "@/lib/learn/types";
import { useSite } from "./LearnerProvider";

const subscribe = () => () => {};
function deviceHasProfile(site: Site): boolean {
  try {
    const raw = window.localStorage.getItem(`${learnConfig.guestStorageKey}:${site}`);
    return !!(raw && JSON.parse(raw)?.profile);
  } catch {
    return false;
  }
}

/** Landing CTA: "start" for newcomers, "continue" when a profile already exists (account or this device). */
export function StartCta({ accountHasProfile, accountsEnabled }: { accountHasProfile: boolean; accountsEnabled: boolean }) {
  const { site, t, href } = useSite();
  const onDevice = useSyncExternalStore(subscribe, () => deviceHasProfile(site), () => false);
  const returning = accountHasProfile || onDevice;

  return (
    <div className="l-stack">
      <Link className="l-btn l-btn-light l-btn-block" href={href(returning ? "/dashboard" : "/onboarding")}>
        ▶ {returning ? t("landing.cta.continue") : t("landing.cta.start")}
      </Link>
      {accountsEnabled && !accountHasProfile && (
        <Link className="l-link" style={{ color: "#fff" }} href={href("/login")}>{t("landing.cta.login")}</Link>
      )}
    </div>
  );
}
