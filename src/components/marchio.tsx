import { cn } from "@/lib/utils";

/**
 * Marchio dell'app: disco-orologio con foglia (cibo + tempo), nero con foglia viola.
 * La geometria è la stessa di scripts/genera-icone.mjs: se la cambi qui, cambiala anche lì
 * e rigenera le icone con `npm run icone`.
 */
export function Marchio({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" aria-hidden className={cn("size-14 shrink-0 rounded-[22%] ring-1 ring-foreground/15", className)}>
      <rect width="512" height="512" fill="#111116" />
      <g transform="translate(256 290)">
        <circle r="150" fill="#fff" />
        <path d="M0 -70 V4 L52 38" fill="none" stroke="#111116" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M0 -156 C14 -240 100 -262 160 -240 C150 -170 80 -132 0 -156 Z" fill="#8e78ff" />
      </g>
    </svg>
  );
}
