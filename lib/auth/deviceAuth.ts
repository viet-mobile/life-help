"use client";

export interface DeviceRegistration {
  deviceId: string;
  deviceName: string;
  applicantEmail: string;
  status: "approved" | "pending" | "rejected";
  isSuperAdminDevice: boolean;
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  ipAddress?: string;
  userAgent?: string;
  memo?: string;
}

const DEVICE_ID_KEY = "life_help_device_id";
const DEVICE_STORAGE_KEY = "life_help_registered_devices";
const DEVICE_AUTH_COOKIE = "life_help_device_token";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "dev-" + Math.random().toString(36).substring(2, 11) + "-" + Date.now().toString(36);
}

function detectDeviceName(): string {
  if (typeof navigator === "undefined") return "지정 업무용 단말기";
  const ua = navigator.userAgent;
  let os = "PC";
  if (ua.includes("Windows")) os = "Windows PC";
  else if (ua.includes("Macintosh")) os = "macOS Workstation";
  else if (ua.includes("iPhone")) os = "Apple iPhone";
  else if (ua.includes("iPad")) os = "Apple iPad";
  else if (ua.includes("Android")) os = "Android Terminal";
  else if (ua.includes("Linux")) os = "Linux Workstation";
  return `최고관리자 전용 단말 (${os})`;
}

/**
 * Get or create the unique hardware fingerprint ID for the current browser/device
 */
export function getCurrentDeviceId(): string {
  if (typeof window === "undefined") return "server-device-id";
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = `LH-DEV-${generateUUID().toUpperCase().substring(0, 16)}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
      document.cookie = `${DEVICE_AUTH_COOKIE}=${id}; path=/; max-age=31536000; SameSite=Lax`;
    }
    return id;
  } catch {
    return "temp-device-id";
  }
}

/**
 * Seed registered devices and ensure current device is pre-approved as Super Admin device
 */
export function getRegisteredDevices(): DeviceRegistration[] {
  if (typeof window === "undefined") return [];

  const currentId = getCurrentDeviceId();
  let devices: DeviceRegistration[] = [];

  try {
    const raw = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (raw) {
      devices = JSON.parse(raw);
    }
  } catch {
    devices = [];
  }

  // Ensure current device is registered and APPROVED as Super Admin device
  const existingCurrent = devices.find((d) => d.deviceId === currentId);
  if (!existingCurrent) {
    const currentDevice: DeviceRegistration = {
      deviceId: currentId,
      deviceName: detectDeviceName(),
      applicantEmail: "sys@life.help",
      status: "approved",
      isSuperAdminDevice: true,
      requestedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      approvedAt: new Date().toISOString(),
      approvedBy: "sys@life.help (최고관리자 본사 직권 승인)",
      ipAddress: "127.0.0.1 (Local Verified)",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Internal Agent",
      memo: "현재 접속 중인 최고관리자 승인 마스터 단말기 (즉시 승인 완료)",
    };
    devices.unshift(currentDevice);
    saveRegisteredDevices(devices);
  } else if (existingCurrent.status !== "approved") {
    // If it was somehow not approved, force approve current device per user requirement
    existingCurrent.status = "approved";
    existingCurrent.isSuperAdminDevice = true;
    existingCurrent.approvedBy = "sys@life.help (최고관리자 본사 직권 승인)";
    existingCurrent.approvedAt = new Date().toISOString();
    saveRegisteredDevices(devices);
  }

  return devices;
}

function saveRegisteredDevices(devices: DeviceRegistration[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(devices));
    window.dispatchEvent(new CustomEvent("life_help_device_updated"));
  } catch {
    // ignore
  }
}

/**
 * Check if the current device is approved to access sys.life.help / /admin
 */
export function isCurrentDeviceApproved(): boolean {
  if (typeof window === "undefined") return true;
  const currentId = getCurrentDeviceId();
  const devices = getRegisteredDevices();
  const found = devices.find((d) => d.deviceId === currentId);
  return Boolean(found && found.status === "approved");
}

/**
 * Get registration details of current device
 */
export function getCurrentDeviceRegistration(): DeviceRegistration | undefined {
  const currentId = getCurrentDeviceId();
  const devices = getRegisteredDevices();
  return devices.find((d) => d.deviceId === currentId);
}

/**
 * Request registration for current device
 */
export function requestDeviceRegistration(
  deviceName: string,
  applicantEmail: string,
  memo?: string,
): DeviceRegistration {
  const currentId = getCurrentDeviceId();
  const devices = getRegisteredDevices();

  const existingIdx = devices.findIndex((d) => d.deviceId === currentId);
  const newReg: DeviceRegistration = {
    deviceId: currentId,
    deviceName: deviceName.trim() || detectDeviceName(),
    applicantEmail: applicantEmail.trim() || "admin@life.help",
    status: "pending",
    isSuperAdminDevice: applicantEmail.trim() === "sys@life.help",
    requestedAt: new Date().toISOString(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    memo: memo?.trim(),
  };

  if (existingIdx >= 0) {
    devices[existingIdx] = {
      ...devices[existingIdx],
      ...newReg,
      // Retain approval if already approved
      status: devices[existingIdx].status === "approved" ? "approved" : "pending",
    };
  } else {
    devices.unshift(newReg);
  }

  saveRegisteredDevices(devices);
  return newReg;
}

/**
 * Approve a device (Super Admin action)
 */
export function approveDevice(deviceId: string, approverEmail = "sys@life.help"): boolean {
  const devices = getRegisteredDevices();
  const target = devices.find((d) => d.deviceId === deviceId);
  if (!target) return false;

  target.status = "approved";
  target.approvedAt = new Date().toISOString();
  target.approvedBy = approverEmail;
  saveRegisteredDevices(devices);
  return true;
}

/**
 * Reject a device
 */
export function rejectDevice(deviceId: string): boolean {
  const devices = getRegisteredDevices();
  const target = devices.find((d) => d.deviceId === deviceId);
  if (!target) return false;

  target.status = "rejected";
  saveRegisteredDevices(devices);
  return true;
}

/**
 * Remove a device
 */
export function deleteDevice(deviceId: string): boolean {
  const devices = getRegisteredDevices();
  const filtered = devices.filter((d) => d.deviceId !== deviceId);
  saveRegisteredDevices(filtered);
  return true;
}

/**
 * Force approve current device as Super Admin device
 */
export function forceRegisterCurrentDeviceAsSuperAdmin(): DeviceRegistration {
  const currentId = getCurrentDeviceId();
  const devices = getRegisteredDevices();
  let dev = devices.find((d) => d.deviceId === currentId);

  if (!dev) {
    dev = {
      deviceId: currentId,
      deviceName: detectDeviceName(),
      applicantEmail: "sys@life.help",
      status: "approved",
      isSuperAdminDevice: true,
      requestedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      approvedBy: "sys@life.help (최고관리자 본사 직권 승인)",
      memo: "최고관리자 승인 마스터 기기",
    };
    devices.unshift(dev);
  } else {
    dev.status = "approved";
    dev.isSuperAdminDevice = true;
    dev.approvedAt = new Date().toISOString();
    dev.approvedBy = "sys@life.help (최고관리자 본사 직권 승인)";
  }

  saveRegisteredDevices(devices);
  return dev;
}

