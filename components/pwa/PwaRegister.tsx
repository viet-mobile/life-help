"use client";

import { useEffect } from "react";

// Augment window object for global PWA prompt storage
declare global {
  interface Window {
    deferredPwaPrompt?: any;
  }
}

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // In development or on localhost, clear and unregister service workers to avoid stale bundle caching
    if (process.env.NODE_ENV !== "production" || window.location.hostname === "localhost") {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) reg.unregister();
        });
      }
      if ("caches" in window) {
        caches.keys().then((keys) => {
          for (const key of keys) caches.delete(key);
        });
      }
      return;
    }

    // 1. Register Service Worker for PWA compliance (production only)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          // Check for worker updates periodically
          reg.update().catch(() => {});
        })
        .catch(() => {
          // Fail silently in environments where worker registration is restricted
        });
    }

    // 2. Capture beforeinstallprompt event for 1-click install triggers
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      window.deferredPwaPrompt = e;
      window.dispatchEvent(new CustomEvent("pwa-prompt-available"));
    };

    const handleAppInstalled = () => {
      window.deferredPwaPrompt = null;
      window.dispatchEvent(new CustomEvent("pwa-installed"));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  return null;
}

