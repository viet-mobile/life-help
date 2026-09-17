const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const UPLOAD_DIR = "C:/Users/leetr/.gemini/antigravity/brain/62f7ae6f-6170-4665-b0bd-46cd339c6910/.user_uploaded/";
const BASE_LOGO = path.join(UPLOAD_DIR, "media_1789352401201.png");
const PUBLIC_LOGOS_DIR = path.join(__dirname, "../public/logos");

const PORTALS = {
  tech: "TECH",
  chat: "CHAT",
  sys: "SYS",
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

async function saveVariants(image512Buffer, portalKey) {
  // 1. High-res logo 512x512
  const logoPath = path.join(PUBLIC_LOGOS_DIR, `logo-${portalKey}.png`);
  fs.writeFileSync(logoPath, image512Buffer);

  // 2. Favicon 192x192
  const fav192 = await sharp(image512Buffer).resize(192, 192).png().toBuffer();
  fs.writeFileSync(path.join(PUBLIC_LOGOS_DIR, `favicon-${portalKey}.png`), fav192);

  // 3. Apple Touch Icon 180x180
  const apple180 = await sharp(image512Buffer).resize(180, 180).png().toBuffer();
  fs.writeFileSync(path.join(PUBLIC_LOGOS_DIR, `apple-touch-icon-${portalKey}.png`), apple180);

  // 4. Favicon 32x32, 16x16, 48x48 for ICO
  const fav32 = await sharp(image512Buffer).resize(32, 32).png().toBuffer();
  fs.writeFileSync(path.join(PUBLIC_LOGOS_DIR, `favicon-${portalKey}-32.png`), fav32);

  const fav16 = await sharp(image512Buffer).resize(16, 16).png().toBuffer();
  const fav48 = await sharp(image512Buffer).resize(48, 48).png().toBuffer();

  const ico = createIco([
    { width: 16, height: 16, buffer: fav16 },
    { width: 32, height: 32, buffer: fav32 },
    { width: 48, height: 48, buffer: fav48 },
  ]);
  fs.writeFileSync(path.join(PUBLIC_LOGOS_DIR, `favicon-${portalKey}.ico`), ico);
}

async function main() {
  if (!fs.existsSync(PUBLIC_LOGOS_DIR)) {
    fs.mkdirSync(PUBLIC_LOGOS_DIR, { recursive: true });
  }

  console.log("Generating portal logos (TECH, CHAT, SYS)...");

  for (const [slug, displayName] of Object.entries(PORTALS)) {
    // 1. Render text in SVG canvas
    const svgText = `
      <svg xmlns="http://www.w3.org/2000/svg" width="3000" height="400">
        <text
          x="50"
          y="260"
          fill="#0b1e4c"
          font-family="Impact, 'Arial Black', sans-serif"
          font-size="200"
          font-weight="900"
        >${displayName}</text>
      </svg>
    `;

    // 2. Trim text to its exact glyph boundaries
    const trimmed = await sharp(Buffer.from(svgText))
      .trim()
      .toBuffer();

    // 3. Stretch/scale horizontally (장평) to exactly 678px (matching width of LIFE HELP below), height 162px
    const textStretched = await sharp(trimmed)
      .resize(678, 162, { fit: "fill" })
      .toBuffer();

    // 4. Composite onto base image at x=180, y=158 (gap to Line 2 at 335 is exactly 15px, matching Line 2-3 gap of 14px)
    const compositeBuf = await sharp(BASE_LOGO)
      .composite([{ input: textStretched, left: 180, top: 158 }])
      .png()
      .toBuffer();

    // 5. Extract 790x790 square and resize to 512x512
    const portal512 = await sharp(compositeBuf)
      .extract({ left: 124, top: 119, width: 790, height: 790 })
      .resize(512, 512)
      .png()
      .toBuffer();

    await saveVariants(portal512, slug);
    console.log(`   -> ${displayName} (${slug}) created.`);
  }

  console.log("All portal logos generated successfully!");
}

main().catch(console.error);

