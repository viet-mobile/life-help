const fs = require('fs');

let content = fs.readFileSync('lib/helper/HelperContext.tsx', 'utf8');

// 1. Update HelperContract interface to include email
content = content.replace(
  `export interface HelperContract {
  name: string;
  residentNumber: string; // Stored securely/locally, masked in UI
  phone: string;`,
  `export interface HelperContract {
  name: string;
  residentNumber: string; // Stored securely/locally, masked in UI
  email: string;
  phone?: string;`
);

// 2. Update HelperProfile interface to include email as primary
content = content.replace(
  `export interface HelperProfile {
  phone: string;
  isVerified: boolean;`,
  `export interface HelperProfile {
  email: string;
  phone?: string;
  isVerified: boolean;`
);

// 3. Update SEED_HELPERS to have email
content = content.replace(
  `  {
    phone: "010-3456-7890",
    isVerified: true,
    isActive: true,
    accessKey: "LH-8291-KCS4-9921-2026",`,
  `  {
    email: "helper.kim@life.help",
    phone: "010-3456-7890",
    isVerified: true,
    isActive: true,
    accessKey: "LH-8291-KCS4-9921-2026",`
);

content = content.replace(
  `      name: "김철수",
      residentNumber: "AUTH-VERIFIED",
      phone: "010-3456-7890",`,
  `      name: "김철수",
      residentNumber: "AUTH-VERIFIED",
      email: "helper.kim@life.help",
      phone: "010-3456-7890",`
);

content = content.replace(
  `  {
    phone: "010-2345-6789",
    isVerified: true,
    isActive: true,
    accessKey: "LH-5120-PYH7-3184-2026",`,
  `  {
    email: "helper.park@life.help",
    phone: "010-2345-6789",
    isVerified: true,
    isActive: true,
    accessKey: "LH-5120-PYH7-3184-2026",`
);

content = content.replace(
  `      name: "박영희",
      residentNumber: "AUTH-VERIFIED",
      phone: "010-2345-6789",`,
  `      name: "박영희",
      residentNumber: "AUTH-VERIFIED",
      email: "helper.park@life.help",
      phone: "010-2345-6789",`
);

content = content.replace(
  `  {
    phone: "010-4567-8901",
    isVerified: true,
    isActive: false, // Currently on break
    accessKey: "LH-9932-LJH1-4482-2026",`,
  `  {
    email: "helper.lee@life.help",
    phone: "010-4567-8901",
    isVerified: true,
    isActive: false, // Currently on break
    accessKey: "LH-9932-LJH1-4482-2026",`
);

content = content.replace(
  `      name: "이준호",
      residentNumber: "AUTH-VERIFIED",
      phone: "010-4567-8901",`,
  `      name: "이준호",
      residentNumber: "AUTH-VERIFIED",
      email: "helper.lee@life.help",
      phone: "010-4567-8901",`
);

content = content.replace(
  `  {
    phone: "010-9876-5432",
    isVerified: true,
    isActive: true,
    accessKey: "LH-7721-NVH5-6612-2026",`,
  `  {
    email: "helper.nguyen@life.help",
    phone: "010-9876-5432",
    isVerified: true,
    isActive: true,
    accessKey: "LH-7721-NVH5-6612-2026",`
);

content = content.replace(
  `      name: "응우옌 반 훙 (Nguyen Van Hung)",
      residentNumber: "AUTH-VERIFIED",
      phone: "010-9876-5432",`,
  `      name: "응우옌 반 훙 (Nguyen Van Hung)",
      residentNumber: "AUTH-VERIFIED",
      email: "helper.nguyen@life.help",
      phone: "010-9876-5432",`
);

// 4. Update requestAccessKey and verifyAccessKey signatures in HelperContextType
content = content.replace(
  `  requestAccessKey: (phone: string) => Promise<{
    success: boolean;
    accessKey: string;
    expiresAt: string;
    notice: ReturnType<typeof formatAccessKeyNotice>;
  }>;
  verifyAccessKey: (
    keyOrPhone: string,
    maybeKey?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  registerHelper: (data: {
    name: string;
    phone: string;
    regions?: HelperRegionItem[];
    services?: string[];
    accessKey?: string;
    accessKeyExpiresAt?: string;
  }) => void;`,
  `  requestAccessKey: (emailOrPhone: string) => Promise<{
    success: boolean;
    accessKey: string;
    expiresAt: string;
    notice: ReturnType<typeof formatAccessKeyNotice>;
  }>;
  verifyAccessKey: (
    keyOrEmail: string,
    maybeKey?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  registerHelper: (data: {
    name: string;
    email?: string;
    phone?: string;
    regions?: HelperRegionItem[];
    services?: string[];
    accessKey?: string;
    accessKeyExpiresAt?: string;
  }) => void;`
);

// 5. Update syncHelperToRegistry
content = content.replace(
  `export function syncHelperToRegistry(profile: HelperProfile): void {
  if (typeof window === "undefined" || !profile || !profile.phone) return;
  try {
    const registry = getRegisteredHelpers();
    const cleanPhone = profile.phone.replace(/[^0-9]/g, "");
    const existingIndex = registry.findIndex(
      (h) => h.phone.replace(/[^0-9]/g, "") === cleanPhone,
    );`,
  `export function syncHelperToRegistry(profile: HelperProfile): void {
  if (typeof window === "undefined" || !profile || (!profile.email && !profile.phone)) return;
  try {
    const registry = getRegisteredHelpers();
    const cleanId = (profile.email || profile.phone || "").toLowerCase().trim();
    const existingIndex = registry.findIndex(
      (h) => (h.email || h.phone || "").toLowerCase().trim() === cleanId,
    );`
);

// 6. Update requestAccessKey implementation
content = content.replace(
  `  // 3-Month Security Access Key issuance (replaces high-frequency SMS)
  const requestAccessKey = useCallback(async (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const key = generateAccessKey("LH");
    const expiresAt = calculateAccessKeyExpiry(90); // 90 days validity
    const notice = formatAccessKeyNotice({
      phone,
      accessKey: key,
      expiresAt,
      portalName: "헬퍼(Helper)",
    });

    try {
      localStorage.setItem(
        \`life_help_pending_helper_key_\${cleanPhone}\`,
        JSON.stringify({ phone: cleanPhone, accessKey: key, expiresAt })
      );
    } catch {
      // ignore
    }

    return {
      success: true,
      accessKey: key,
      expiresAt,
      notice,
    };
  }, []);`,
  `  // 90-Day Security Access Key issuance via Email (replaces SMS)
  const requestAccessKey = useCallback(async (emailOrPhone: string) => {
    const email = emailOrPhone.trim();
    const cleanId = email.toLowerCase().replace(/[^a-z0-9@._-]/g, "");
    const key = generateAccessKey("LH");
    const expiresAt = calculateAccessKeyExpiry(90); // 90 days validity
    const notice = formatAccessKeyNotice({
      email,
      accessKey: key,
      expiresAt,
      portalName: "헬퍼(Helper)",
    });

    try {
      localStorage.setItem(
        \`life_help_pending_helper_key_\${cleanId}\`,
        JSON.stringify({ email, accessKey: key, expiresAt })
      );
    } catch {
      // ignore
    }

    return {
      success: true,
      accessKey: key,
      expiresAt,
      notice,
    };
  }, []);`
);

fs.writeFileSync('lib/helper/HelperContext.tsx', content, 'utf8');
console.log('Successfully updated lib/helper/HelperContext.tsx');

