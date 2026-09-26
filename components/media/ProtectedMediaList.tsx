"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleContext";

type MediaItem = { id: string; kind: "IMAGE" | "VIDEO"; contentType: string };

/**
 * In-app view of a request's photos / videos (owner or the currently assigned Helper; the server
 * re-authorizes and logs every view). Deterrence, not a technical guarantee: no download link, no
 * context menu / drag, videos without download / picture-in-picture controls, and a per-viewer
 * watermark (opaque viewer tag + time, no personal data). Web pages cannot block screenshots or screen
 * recording; the notice says so truthfully.
 */
export function ProtectedMediaList({ requestId, audience }: { requestId: string; audience: "customer" | "helper" }) {
  const { t } = useLocale();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [tag, setTag] = useState("");
  const [viewedAt] = useState(() => new Date().toISOString().slice(0, 16).replace("T", " "));

  useEffect(() => {
    let active = true;
    void fetch(`/api/media?requestId=${encodeURIComponent(requestId)}`, { cache: "no-store" })
      .then((r) => r.json()).then((data) => {
        if (!active || data?.success !== true) return;
        setItems(Array.isArray(data.media) ? data.media : []);
        setTag(typeof data.watermark === "string" ? data.watermark : "");
      }).catch(() => undefined);
    return () => { active = false; };
  }, [requestId]);

  if (items.length === 0) return null;
  const watermark = `LIFE.HELP · ${tag} · ${viewedAt}`;
  return (
    <section data-testid="protected-media" className="mt-3">
      <p data-testid="protected-media-notice" className="text-[11px] font-semibold leading-relaxed text-slate-600">
        {audience === "helper" ? t("media.helperNotice") : t("media.customerNotice")}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {items.map((item) => (
          <div key={item.id} data-testid="protected-media-item" className="relative overflow-hidden rounded border border-slate-200 bg-slate-100" onContextMenu={(e) => e.preventDefault()}>
            {item.kind === "IMAGE" ? (
              // eslint-disable-next-line @next/next/no-img-element -- authorized same-origin stream, never optimized / cached
              <img src={`/api/media/${item.id}`} alt="" draggable={false} className="block h-40 w-full select-none object-cover" />
            ) : (
              <video src={`/api/media/${item.id}`} controls controlsList="nodownload noremoteplayback noplaybackrate" disablePictureInPicture playsInline preload="metadata" className="block h-40 w-full" />
            )}
            <div data-testid="protected-media-watermark" aria-hidden="true" className="pointer-events-none absolute inset-0 flex flex-col justify-around overflow-hidden text-[10px] font-black text-white/60 [text-shadow:0_0_2px_rgba(0,0,0,0.8)]">
              {[0, 1, 2].map((row) => <span key={row} className="block -rotate-12 whitespace-nowrap text-center">{watermark}</span>)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
