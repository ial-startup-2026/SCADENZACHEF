// Genera le icone PWA (PNG) da un SVG. Uso: npm run icone
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

// Stessa geometria di src/components/marchio.tsx: se la cambi qui, cambiala anche là.
const glifo = (scala) => `
  <g transform="translate(256 ${scala === 1 ? 290 : 280}) scale(${scala})">
    <circle r="150" fill="#fff"/>
    <path d="M0 -70 V4 L52 38" fill="none" stroke="#1f5a3f" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M0 -156 C14 -240 100 -262 160 -240 C150 -170 80 -132 0 -156 Z" fill="#9fe0bc"/>
  </g>`;

// "pieno" = quadrato a tutto campo (maskable / iOS): il sistema ritaglia gli angoli.
const svg = (pieno) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a7a55"/><stop offset="1" stop-color="#14402c"/></linearGradient></defs>
  <rect width="512" height="512" rx="${pieno ? 0 : 112}" fill="url(#g)"/>
  ${glifo(pieno ? 0.78 : 1)}
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
