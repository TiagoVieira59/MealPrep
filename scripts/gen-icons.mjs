import sharp from "sharp";
import fs from "node:fs";
const svg = fs.readFileSync("public/icon.svg");
for (const s of [192, 512]) await sharp(svg).resize(s, s).png().toFile(`public/icons/icon-${s}.png`);
// maskable: ícone com margem de segurança
await sharp(svg).resize(410, 410).extend({ top: 51, bottom: 51, left: 51, right: 51, background: "#1F6A55" }).png().toFile("public/icons/maskable-512.png");
await sharp(svg).resize(180, 180).png().toFile("public/icons/apple-touch-icon.png");
