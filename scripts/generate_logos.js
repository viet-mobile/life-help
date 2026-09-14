const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const UPLOAD_DIR = "C:/Users/leetr/.gemini/antigravity/brain/62f7ae6f-6170-4665-b0bd-46cd339c6910/.user_uploaded/";
const PUBLIC_LOGOS_DIR = path.join(__dirname, "../public/logos");
const PUBLIC_DIR = path.join(__dirname, "../public");
const APP_DIR = path.join(__dirname, "../app");

// User provided authentic images
const USER_LOGOS = {
  base: path.join(UPLOAD_DIR, "media_1789352401201.png"),
  korea: path.join(UPLOAD_DIR, "media_1789352319930.png"),
  japan: path.join(UPLOAD_DIR, "media_1789352319937.png"),
  china: path.join(UPLOAD_DIR, "media_1789352319905.png"),
  indonesia: path.join(UPLOAD_DIR, "media_1789352319902.png"),
  vietnam: path.join(UPLOAD_DIR, "media_1789354426604.png"),
};

// All countries from proxy.ts
const COUNTRY_DISPLAY_NAMES = {
  korea: "KOREA",
  japan: "JAPAN",
  china: "CHINA",
  taiwan: "TAIWAN",
  vietnam: "VIETNAM",
  philippines: "PHILIPPINES",
  indonesia: "INDONESIA",
  russia: "RUSSIA",
  uzbek: "UZBEKISTAN",
  nepal: "NEPAL",
  india: "INDIA",
  cambodia: "CAMBODIA",
  thailand: "THAILAND",
  myanmar: "MYANMAR",
  srilanka: "SRI LANKA",
  kazakh: "KAZAKHSTAN",
  france: "FRANCE",
  deutsch: "GERMANY",
  turkiye: "TURKEY",
  ukraina: "UKRAINE",
  timorleste: "TIMOR-LESTE",
  uae: "UAE",
  italia: "ITALY",
  egypt: "EGYPT",
  espania: "SPAIN",
  iran: "IRAN",
  netherland: "NETHERLANDS",
  poland: "POLAND",
  ethiopia: "ETHIOPIA",
  sweden: "SWEDEN",
  israel: "ISRAEL",
  denmark: "DENMARK",
  norway: "NORWAY",
  mongol: "MONGOLIA",
  mexico: "MEXICO",
  brazil: "BRAZIL",
  greece: "GREECE",
  portugal: "PORTUGAL",
  southafrica: "SOUTH AFRICA",
  swiss: "SWITZERLAND",
  pakistan: "PAKISTAN",
  saudiarabia: "SAUDI ARABIA",
  yemen: "YEMEN",
  iraq: "IRAQ",
  bangladesh: "BANGLADESH",
  us: "USA",
  uk: "UK",
  canada: "CANADA",
  australia: "AUSTRALIA",
  newzealand: "NEW ZEALAND",
};

function createIco(pngBuffers) {
  const numImages = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // ICO
  header.writeUInt16LE(numImages, 4);

  const dirEntries = [];
  let offset = 6 + numImages * 16;

  for (const { width, height, buffer } of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(width >= 256 ? 0 : width, 0);
    entry.writeUInt8(height >= 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(buffer.length, 8);
    entry.writeUInt32LE(offset, 12);
    dirEntries.push(entry);
    offset += buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers.map((p) => p.buffer)]);
}

async function saveVariants(image512Buffer, countryKey) {
  // 1. High-res logo 512x512
  const logoPath = path.join(PUBLIC_LOGOS_DIR, `logo-${countryKey}.png`);
  fs.writeFileSync(logoPath, image512Buffer);

  // 2. Favicon 192x192
  const fav192 = await sharp(image512Buffer).resize(192, 192).png().toBuffer();
  fs.writeFileSync(path.join(PUBLIC_LOGOS_DIR, `favicon-${countryKey}.png`), fav192);

  // 3. Apple Touch Icon 180x180
  const apple180 = await sharp(image512Buffer).resize(180, 180).png().toBuffer();
  fs.writeFileSync(path.join(PUBLIC_LOGOS_DIR, `apple-touch-icon-${countryKey}.png`), apple180);

  // 4. Favicon 32x32 and 16x16 for ICO
  const fav32 = await sharp(image512Buffer).resize(32, 32).png().toBuffer();
  fs.writeFileSync(path.join(PUBLIC_LOGOS_DIR, `favicon-${countryKey}-32.png`), fav32);

  const fav16 = await sharp(image512Buffer).resize(16, 16).png().toBuffer();
  const fav48 = await sharp(image512Buffer).resize(48, 48).png().toBuffer();

  const ico = createIco([
    { width: 16, height: 16, buffer: fav16 },
    { width: 32, height: 32, buffer: fav32 },
    { width: 48, height: 48, buffer: fav48 },
  ]);
  fs.writeFileSync(path.join(PUBLIC_LOGOS_DIR, `favicon-${countryKey}.ico`), ico);

  // If default, also update root public/favicon.ico and app/favicon.ico
  if (countryKey === "default") {
    fs.writeFileSync(path.join(PUBLIC_DIR, "favicon.ico"), ico);
    fs.writeFileSync(path.join(APP_DIR, "favicon.ico"), ico);
  }
}

async function main() {
  if (!fs.existsSync(PUBLIC_LOGOS_DIR)) {
    fs.mkdirSync(PUBLIC_LOGOS_DIR, { recursive: true });
  }

  console.log("1. Generating Base / Default LIFE.HELP Logo...");
  const base512 = await sharp(USER_LOGOS.base)
    .extract({ left: 144, top: 226, width: 750, height: 750 })
    .resize(512, 512)
    .png()
    .toBuffer();
  await saveVariants(base512, "default");
  console.log("   -> Default logo and favicons created.");

  console.log("2. Processing User-Uploaded Country Logos...");
  // Korea
  const korea512 = await sharp(USER_LOGOS.korea)
    .extract({ left: 124, top: 119, width: 790, height: 790 })
    .resize(512, 512)
    .png()
    .toBuffer();
  await saveVariants(korea512, "korea");
  console.log("   -> Korea created.");

  // Japan
  const japan512 = await sharp(USER_LOGOS.japan)
    .extract({ left: 119, top: 120, width: 790, height: 790 })
    .resize(512, 512)
    .png()
    .toBuffer();
  await saveVariants(japan512, "japan");
  console.log("   -> Japan created.");

  // Indonesia
  const indonesia512 = await sharp(USER_LOGOS.indonesia)
    .extract({ left: 124, top: 118, width: 790, height: 790 })
    .resize(512, 512)
    .png()
    .toBuffer();
  await saveVariants(indonesia512, "indonesia");
  console.log("   -> Indonesia created.");

  // China
  const china512 = await sharp(USER_LOGOS.china)
    .extract({ left: 95, top: 115, width: 870, height: 870 })
    .resize(512, 512)
    .png()
    .toBuffer();
  await saveVariants(china512, "china");
  console.log("   -> China created.");

  // Vietnam (User uploaded authentic file media_1789354426604.png)
  const vietnam512 = await sharp(USER_LOGOS.vietnam)
    .extract({ left: 124, top: 119, width: 790, height: 790 })
    .resize(512, 512)
    .png()
    .toBuffer();
  await saveVariants(vietnam512, "vietnam");
  console.log("   -> Vietnam created from authentic user image.");

  console.log("3. Generating other country logos with matching full-width typography...");
  for (const [slug, displayName] of Object.entries(COUNTRY_DISPLAY_NAMES)) {
    if (["korea", "japan", "china", "indonesia", "vietnam"].includes(slug)) {
      continue; // user authentic files
    }

    const len = displayName.length;
    let fontSize = 185;
    if (len >= 13) {
      fontSize = 115;
    } else if (len >= 10) {
      fontSize = 140;
    } else if (len >= 8) {
      fontSize = 165;
    }

    const svg = `
      <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
        <text
          x="180"
          y="330"
          fill="#0b1e4c"
          font-family="Impact, 'Arial Black', sans-serif"
          font-size="${fontSize}"
          font-weight="900"
          textLength="678"
          lengthAdjust="spacingAndGlyphs"
        >${displayName}</text>
      </svg>
    `;

    const compositeBuf = await sharp(USER_LOGOS.base)
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .png()
      .toBuffer();

    const country512 = await sharp(compositeBuf)
      .extract({ left: 124, top: 119, width: 790, height: 790 })
      .resize(512, 512)
      .png()
      .toBuffer();

    await saveVariants(country512, slug);
    console.log(`   -> ${displayName} (${slug}) created.`);
  }

  console.log("All logos generated successfully!");
}

main().catch(console.error);
