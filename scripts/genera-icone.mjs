// Genera le icone PWA (PNG) da un SVG. Uso: npm run icone
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const VERDE = "#1f5a3f";

// "pieno" = quadrato a tutto campo (maskable); altrimenti angoli arrotondati.
const svg = (pieno) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${pieno ? 0 : 112}" fill="${VERDE}"/>
  <g transform="translate(256 256) scale(${pieno ? 0.78 : 1})" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round">
    <circle r="150" stroke-width="28"/>
    <path d="M0 -80 V0 L58 38" stroke-width="28"/>
    <path d="M-62 150 L-20 190 L66 104" stroke-width="0"/>
  </g>
</svg>`;

await mkdir("public/icons", { recursive: true });
const out = async (nome, dim, pieno) =>
  writeFile(`${nome}`, await sharp(Buffer.from(svg(pieno))).resize(dim, dim).png().toBuffer());

await out("public/icons/icon-192.png", 192, false);
await out("public/icons/icon-512.png", 512, false);
await out("public/icons/icon-maskable-512.png", 512, true);
await out("src/app/apple-icon.png", 180, true);
await out("src/app/icon.png", 512, false);
console.log("Icone generate.");
