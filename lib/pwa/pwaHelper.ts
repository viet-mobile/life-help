/**
 * PWA and OS Environment Helper
 * Detects client OS (iOS, iPadOS, Android, macOS, Windows) and provides
 * tailored installation instructions, button labels, and metadata across all locales.
 * 
 * STRICT USER RULE: ABSOLUTELY ZERO PARENTHESES () IN KOREAN TEXT (USE · OR NEWLINE ONLY).
 */

export type UserOS = "ios" | "ipados" | "android" | "windows" | "macos" | "other";

export function detectUserOS(): UserOS {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return "other";
  }

  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const maxTouchPoints = navigator.maxTouchPoints || 0;

  // 1. iPadOS detection (iPad reports as MacIntel with touch points)
  if (
    /iPad/i.test(ua) ||
    (platform === "MacIntel" && maxTouchPoints > 1 && !/iPhone/i.test(ua))
  ) {
    return "ipados";
  }

  // 2. iOS detection (iPhone, iPod)
  if (/iPhone|iPod/i.test(ua)) {
    return "ios";
  }

  // 3. Android detection
  if (/Android/i.test(ua)) {
    return "android";
  }

  // 4. Windows detection
  if (/Win/i.test(platform) || /Windows/i.test(ua)) {
    return "windows";
  }

  // 5. macOS detection
  if (/Mac/i.test(platform) || /Macintosh/i.test(ua)) {
    return "macos";
  }

  return "other";
}

export interface OsInstallGuide {
  os: UserOS;
  osDisplayName: string;
  buttonLabel: string;
  modalTitle: string;
  steps: string[];
  buttonLabelKo: string;
  buttonLabelEn: string;
  modalTitleKo: string;
  modalTitleEn: string;
  stepsKo: string[];
  stepsEn: string[];
  primaryActionType: "pwa-prompt" | "ios-guide" | "desktop-shortcut";
}

import pwaLocalesData from "./pwaLocales.json";

const PWA_I18N: Record<string, Record<UserOS, { buttonLabel: string; modalTitle: string; steps: string[] }>> = pwaLocalesData as unknown as Record<string, Record<UserOS, { buttonLabel: string; modalTitle: string; steps: string[] }>>;

export function getOsInstallGuide(os: UserOS, locale: string = "ko"): OsInstallGuide {
  const normalizedLocale = (locale || "ko").toLowerCase();
  const primaryLocale = normalizedLocale.split("-")[0];

  const localizedSet =
    PWA_I18N[normalizedLocale] ||
    PWA_I18N[primaryLocale] ||
    PWA_I18N["ko"];

  const entry = localizedSet[os] || localizedSet["other"] || PWA_I18N["ko"]["macos"];
  const koEntry = PWA_I18N["ko"][os] || PWA_I18N["ko"]["other"];

  // Default English baseline
  let enButton = "💻 Add to Dock / Install App";
  let enTitle = "How to Install App on Mac";
  let enSteps = [
    "On Chrome or Edge, click the Install App button below or in the address bar.",
    "On Safari, click 'File' in the menu bar and choose 'Add to Dock'.",
    "The standalone app shortcut will appear in your Mac Dock and Launchpad."
  ];

  if (os === "windows") {
    enButton = "🖥️ Install App to Desktop";
    enTitle = "Install App to Windows Desktop";
    enSteps = [
      "Click the Install button below to launch the native Edge or Chrome install dialog.",
      "Click 'Install' to add dedicated shortcuts to your desktop and taskbar.",
      "Enjoy a fast, standalone full-screen experience with no address bar clutter."
    ];
  } else if (os === "android") {
    enButton = "📱 Install App to Home Screen";
    enTitle = "Install App on Android Home Screen";
    enSteps = [
      "Tap the button below to trigger the 1-click home screen install prompt.",
      "If the dialog does not appear automatically, tap the browser menu (three dots) in the top right.",
      "Select 'Install app' or 'Add to Home screen' to install as a standalone app."
    ];
  } else if (os === "ios") {
    enButton = "📱 Add to Home Screen";
    enTitle = "How to Add to iPhone Home Screen";
    enSteps = [
      "Tap the Share button (square with arrow up) at the bottom of Safari.",
      "Scroll down and select 'Add to Home Screen'.",
      "Tap 'Add' in the top right corner to create the app icon on your home screen."
    ];
  } else if (os === "ipados") {
    enButton = "📱 Add to Home Screen";
    enTitle = "How to Add to iPad Home Screen";
    enSteps = [
      "Tap the Share icon in the top right corner of Safari.",
      "Select 'Add to Home Screen' from the menu.",
      "Tap 'Add' to install the shortcut on your iPad home screen."
    ];
  }

  const osDisplayNameMap: Record<UserOS, string> = {
    macos: "macOS · Mac",
    windows: "Windows PC",
    android: "Android",
    ios: "iOS · iPhone",
    ipados: "iPadOS · iPad",
    other: "Web App"
  };

  const actionTypeMap: Record<UserOS, "pwa-prompt" | "ios-guide" | "desktop-shortcut"> = {
    macos: "pwa-prompt",
    windows: "pwa-prompt",
    android: "pwa-prompt",
    ios: "ios-guide",
    ipados: "ios-guide",
    other: "pwa-prompt"
  };

  const buttonLabel = normalizedLocale === "en" ? enButton : entry.buttonLabel;
  const modalTitle = normalizedLocale === "en" ? enTitle : entry.modalTitle;
  const steps = normalizedLocale === "en" ? enSteps : entry.steps;

  return {
    os,
    osDisplayName: osDisplayNameMap[os],
    buttonLabel,
    modalTitle,
    steps,
    buttonLabelKo: koEntry.buttonLabel,
    buttonLabelEn: enButton,
    modalTitleKo: koEntry.modalTitle,
    modalTitleEn: enTitle,
    stepsKo: koEntry.steps,
    stepsEn: enSteps,
    primaryActionType: actionTypeMap[os]
  };
}
