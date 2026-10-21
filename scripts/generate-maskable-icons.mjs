// Generates public/logos/maskable-<slug>.png (512x512, logo inside the 80% safe zone on an opaque background)
// from the existing public/logos/logo-<slug>.png. Run: node scripts/generate-maskable-icons.mjs
import { readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const dir = path.resolve("public/logos");
const SIZE = 512;
const INNER = 400;

for (const f of await readdir(dir)) {
  const m = /^logo-(.+)\.png$/.exec(f);
  if (!m || m[1] === "jiu") continue; // jiu ships its own maskable icon
  const src = path.join(dir, f);
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  // background: the logo's own corner colour when opaque, otherwise white
  const a = data[3];
  const background = a > 250 ? { r: data[0], g: data[1], b: data[2], alpha: 1 } : { r: 255, g: 255, b: 255, alpha: 1 };
  void info;
  const inner = await sharp(src).resize(INNER, INNER, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background } })
    .composite([{ input: inner, gravity: "center" }])
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toFile(path.join(dir, `maskable-${m[1]}.png`));
}
console.log("done");
