import { describe, it, expect } from "vitest";
import { isQuietHoursNow, canReceiveEmergencyCall, type HelperPushTarget } from "../../lib/service/pushDispatcher";

describe("pushDispatcher: quiet hours and availability rules", () => {
  it("correctly identifies normal daytime quiet hours", () => {
    // 13:00 ~ 15:00
    const d1 = new Date("2026-11-21T14:30:00");
    const d2 = new Date("2026-11-21T16:00:00");
    expect(isQuietHoursNow("13:00", "15:00", d1)).toBe(true);
    expect(isQuietHoursNow("13:00", "15:00", d2)).toBe(false);
  });

  it("correctly identifies overnight quiet hours crossing midnight", () => {
    // 22:00 ~ 08:00
    const night = new Date("2026-11-21T23:30:00");
    const dawn = new Date("2026-11-21T06:15:00");
    const daytime = new Date("2026-11-21T14:00:00");

    expect(isQuietHoursNow("22:00", "08:00", night)).toBe(true);
    expect(isQuietHoursNow("22:00", "08:00", dawn)).toBe(true);
    expect(isQuietHoursNow("22:00", "08:00", daytime)).toBe(false);
  });

  it("blocks emergency calls when helper is in quiet hours", () => {
    const helper: HelperPushTarget = {
      helperId: "h1",
      displayName: "테스트 기사",
      phone: "010-1234-5678",
      quietEnabled: true,
      quietStart: "22:00",
      quietEnd: "08:00",
      allowCallsWhileBusy: true,
      activeJobsCount: 0,
      subscriptions: [],
    };

    const nightTime = new Date("2026-11-21T23:00:00");
    const check = canReceiveEmergencyCall(helper, nightTime);
    expect(check.eligible).toBe(false);
    expect(check.reason).toBe("QUIET_HOURS");
  });

  it("allows emergency calls when quiet hours is disabled even at night", () => {
    const helper: HelperPushTarget = {
      helperId: "h1",
      displayName: "테스트 기사",
      phone: "010-1234-5678",
      quietEnabled: false, // OFF
      quietStart: "22:00",
      quietEnd: "08:00",
      allowCallsWhileBusy: true,
      activeJobsCount: 0,
      subscriptions: [],
    };

    const nightTime = new Date("2026-11-21T23:00:00");
    const check = canReceiveEmergencyCall(helper, nightTime);
    expect(check.eligible).toBe(true);
  });

  it("blocks calls when helper is busy with a job and opted out of busy calls", () => {
    const helper: HelperPushTarget = {
      helperId: "h1",
      displayName: "테스트 기사",
      phone: "010-1234-5678",
      quietEnabled: false,
      quietStart: "22:00",
      quietEnd: "08:00",
      allowCallsWhileBusy: false, // Do not call while working!
      activeJobsCount: 1, // Currently working on a job
      subscriptions: [],
    };

    const dayTime = new Date("2026-11-21T14:00:00");
    const check = canReceiveEmergencyCall(helper, dayTime);
    expect(check.eligible).toBe(false);
    expect(check.reason).toBe("BUSY_WITH_JOB");
  });

  it("allows calls when helper is busy with a job but opted IN to receive busy calls", () => {
    const helper: HelperPushTarget = {
      helperId: "h1",
      displayName: "테스트 기사",
      phone: "010-1234-5678",
      quietEnabled: false,
      quietStart: "22:00",
      quietEnd: "08:00",
      allowCallsWhileBusy: true, // Multi-tasking allowed!
      activeJobsCount: 1,
      subscriptions: [],
    };

    const dayTime = new Date("2026-11-21T14:00:00");
    const check = canReceiveEmergencyCall(helper, dayTime);
    expect(check.eligible).toBe(true);
  });
});
