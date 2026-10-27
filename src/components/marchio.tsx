import { cn } from "@/lib/utils";

/**
 * Marchio dell'app: disco-orologio con foglia (cibo + tempo).
 * La geometria è la stessa di scripts/genera-icone.mjs: se la cambi qui, cambiala anche lì
 * e rigenera le icone con `npm run icone`.
 */
export function Marchio({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" aria-hidden className={cn("size-14 shrink-0", className)}>
      <defs>
        <linearGradient id="marchio-sfondo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2a7a55" />
          <stop offset="1" stopColor="#14402c" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#marchio-sfondo)" />
      <g transform="translate(256 290)">
        <circle r="150" fill="#fff" />
        <path d="M0 -70 V4 L52 38" fill="none" stroke="#1f5a3f" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M0 -156 C14 -240 100 -262 160 -240 C150 -170 80 -132 0 -156 Z" fill="#9fe0bc" />
      </g>
    </svg>
  );
}
