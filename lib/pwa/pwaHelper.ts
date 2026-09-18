/**
 * PWA and OS Environment Helper
 * Detects client OS (iOS, iPadOS, Android, macOS, Windows) and provides
 * tailored installation instructions, button labels, and metadata.
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
  buttonLabelKo: string;
  buttonLabelEn: string;
  modalTitleKo: string;
  modalTitleEn: string;
  stepsKo: string[];
  stepsEn: string[];
  primaryActionType: "pwa-prompt" | "ios-guide" | "dock-guide";
}

export function getOsInstallGuide(os: UserOS, locale: string = "ko"): OsInstallGuide {
  switch (os) {
    case "ios":
      return {
        os: "ios",
        osDisplayName: "iOS · iPhone",
        buttonLabelKo: "📱 홈 화면에 바로가기 추가",
        buttonLabelEn: "📱 Add to Home Screen",
        modalTitleKo: "iPhone 홈 화면에 바로가기 앱 추가 방법",
        modalTitleEn: "How to Add to iPhone Home Screen",
        stepsKo: [
          "Safari 브라우저 하단 중앙의 공유 아이콘 · 네모에 위 화살표 모양을 탭합니다.",
          "메뉴 목록을 위로 올려 [ 홈 화면에 추가 ] 항목을 선택합니다.",
          "우측 상단의 [ 추가 ] 버튼을 누르면 스마트폰 홈 화면에 바로가기 앱이 생성됩니다."
        ],
        stepsEn: [
          "Tap the Share button (square with arrow up) at the bottom of Safari.",
          "Scroll down and select 'Add to Home Screen'.",
          "Tap 'Add' in the top right corner to create the app icon on your home screen."
        ],
        primaryActionType: "ios-guide"
      };

    case "ipados":
      return {
        os: "ipados",
        osDisplayName: "iPadOS · iPad",
        buttonLabelKo: "📱 홈 화면에 바로가기 추가",
        buttonLabelEn: "📱 Add to Home Screen",
        modalTitleKo: "iPad 홈 화면에 바로가기 앱 추가 방법",
        modalTitleEn: "How to Add to iPad Home Screen",
        stepsKo: [
          "Safari 브라우저 우측 상단의 공유 아이콘 · 네모에 위 화살표 모양을 탭합니다.",
          "공유 메뉴에서 [ 홈 화면에 추가 ] 항목을 선택합니다.",
          "우측 상단 [ 추가 ]를 누르면 아이패드 홈 화면에 바로가기 앱이 생성됩니다."
        ],
        stepsEn: [
          "Tap the Share icon in the top right corner of Safari.",
          "Select 'Add to Home Screen' from the menu.",
          "Tap 'Add' to install the shortcut on your iPad home screen."
        ],
        primaryActionType: "ios-guide"
      };

    case "android":
      return {
        os: "android",
        osDisplayName: "Android",
        buttonLabelKo: "📱 홈 화면에 바로가기 앱 설치",
        buttonLabelEn: "📱 Install App to Home Screen",
        modalTitleKo: "Android 홈 화면에 바로가기 앱 설치",
        modalTitleEn: "Install App on Android Home Screen",
        stepsKo: [
          "아래 [ 지금 앱 설치하기 ] 버튼을 누르면 1클릭으로 홈 화면 추가 대화상자가 열립니다.",
          "대화상자가 자동으로 열리지 않을 경우 브라우저 우측 상단 더보기 버튼 · 점 3개 모양을 누릅니다.",
          "[ 앱 설치 ] 또는 [ 홈 화면에 추가 ]를 선택하시면 독립 실행형 앱으로 설치됩니다."
        ],
        stepsEn: [
          "Tap the button below to trigger the 1-click home screen install prompt.",
          "If the dialog does not appear automatically, tap the browser menu (three dots) in the top right.",
          "Select 'Install app' or 'Add to Home screen' to install as a standalone app."
        ],
        primaryActionType: "pwa-prompt"
      };

    case "macos":
      return {
        os: "macos",
        osDisplayName: "macOS · Mac",
        buttonLabelKo: "💻 Dock에 추가 · 앱 설치",
        buttonLabelEn: "💻 Add to Dock / Install App",
        modalTitleKo: "Mac에 바로가기 앱 설치 방법",
        modalTitleEn: "How to Install App on Mac",
        stepsKo: [
          "Chrome 또는 Edge 브라우저의 경우 주소창 우측의 [ 앱 설치 ] 버튼이나 아래 설치 버튼을 누르면 1클릭 설치가 진행됩니다.",
          "Safari 브라우저의 경우 상단 메뉴 막대에서 [ 파일 ] ➔ [ Dock에 추가 ]를 선택합니다.",
          "설치 완료 시 Mac의 독 · Dock과 런치패드에 독립 실행 아이콘이 생성됩니다."
        ],
        stepsEn: [
          "On Chrome or Edge, click the Install App button below or in the address bar.",
          "On Safari, click 'File' in the menu bar and choose 'Add to Dock'.",
          "The standalone app shortcut will appear in your Mac Dock and Launchpad."
        ],
        primaryActionType: "pwa-prompt"
      };

    case "windows":
    default:
      return {
        os: "windows",
        osDisplayName: "Windows PC",
        buttonLabelKo: "🖥️ 바탕화면에 바로가기 앱 설치",
        buttonLabelEn: "🖥️ Install App to Desktop",
        modalTitleKo: "Windows 바탕화면에 바로가기 앱 설치",
        modalTitleEn: "Install App to Windows Desktop",
        stepsKo: [
          "아래 [ 🖥️ 바탕화면에 바로가기 앱 설치 ] 버튼을 클릭하면 Edge 또는 Chrome 브라우저의 앱 설치창이 뜹니다.",
          "[ 설치 ]를 누르시면 바탕화면과 작업표시줄에 전용 아이콘이 즉시 생성됩니다.",
          "브라우저 주소창 없이 깨끗하고 빠른 독립형 창으로 사이트를 편리하게 이용할 수 있습니다."
        ],
        stepsEn: [
          "Click the Install button below to launch the native Edge or Chrome install dialog.",
          "Click 'Install' to add dedicated shortcuts to your desktop and taskbar.",
          "Enjoy a fast, standalone full-screen experience with no address bar clutter."
        ],
        primaryActionType: "pwa-prompt"
      };
  }
}
