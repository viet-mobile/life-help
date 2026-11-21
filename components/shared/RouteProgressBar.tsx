"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * High-performance, zero-dependency Top Navigation Progress Bar.
 * Immediately animates a sleek amber bar at the very top of the window
 * whenever an internal <Link> is clicked, providing instant visual feedback.
 */
export function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [navigating, setNavigating] = useState(false);

  // When navigation completes and pathname/searchParams update, turn off the bar
  useEffect(() => {
    setNavigating(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // Find the closest anchor tag
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target || target.target === "_blank") return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore external links, hash-only anchors, mailto, tel
      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:")
      ) {
        return;
      }

      // Check if internal navigation
      try {
        const url = new URL(href, window.location.href);
        if (url.origin === window.location.origin) {
          // If clicking link to a different page/path
          if (url.pathname !== window.location.pathname || url.search !== window.location.search) {
            setNavigating(true);
          }
        }
      } catch {
        // ignore
      }
    };

    document.addEventListener("click", handleDocumentClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleDocumentClick, { capture: true });
    };
  }, []);

  if (!navigating) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent pointer-events-none"
    >
      <div className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 animate-[route-progress_1.8s_ease-in-out_infinite] shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
      <style jsx global>{`
        @keyframes route-progress {
          0% {
            width: 0%;
            margin-left: 0%;
          }
          50% {
            width: 75%;
            margin-left: 20%;
          }
          100% {
            width: 100%;
            margin-left: 100%;
          }
        }
      `}</style>
    </div>
  );
}
