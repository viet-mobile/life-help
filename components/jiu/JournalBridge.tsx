"use client";
import { useEffect } from "react";
import { appendEvent, validEvent } from "@/lib/jiu/journal";
import { parseLearnHost } from "@/lib/learn/hosts";

import { JournalMailSync } from "./JournalMailSync";

export function JournalReceiver() {
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== window.parent) return;
      let url: URL;
      try { url = new URL(event.origin); } catch { return; }
      const host = parseLearnHost(url.host);
      if (!host || (url.protocol !== "https:" && host.stage !== "local")) return;
      if (event.data?.type !== "jiu-journal" || !validEvent(event.data.event) || event.data.event.site !== host.site) return;
      try { appendEvent(event.data.event); event.source?.postMessage({ type: "jiu-saved", id: event.data.event.id }, { targetOrigin: event.origin }); } catch { /* Storage blocked: leave sender's queue intact. */ }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);
  return <JournalMailSync silent />;
}
