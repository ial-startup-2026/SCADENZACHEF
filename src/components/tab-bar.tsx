"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  House,
  ScanLine,
  ShoppingCart,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Voce = { href: string; etichetta: string; icona: LucideIcon };

const VOCI: Voce[] = [
  { href: "/", etichetta: "Home", icona: House },
  { href: "/magazzino", etichetta: "Magazzino", icona: Boxes },
  { href: "/scansiona", etichetta: "Scansiona", icona: ScanLine },
  { href: "/spesa", etichetta: "Spesa", icona: ShoppingCart },
  { href: "/profilo", etichetta: "Profilo", icona: UserRound },
];

/** `percorso` forza la voce attiva (serve solo alle anteprime in /design). */
export function TabBar({ percorso }: { percorso?: string }) {
  const pathnameReale = usePathname();
  const pathname = percorso ?? pathnameReale;
  const attiva = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      aria-label="Navigazione principale"
      className="pointer-events-none fixed inset-x-2 bottom-0 z-40 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      {/* Barra fluttuante a pillola: la voce attiva è una pillola nera, non solo un colore diverso. */}
      <ul className="pointer-events-auto mx-auto grid max-w-xl grid-cols-[1fr_1.2fr_1.1fr_1fr_1fr] items-end rounded-full bg-card p-1 shadow-[0_12px_40px_-8px_rgb(17_17_22/0.3)] ring-1 ring-black/5">
        {VOCI.map(({ href, etichetta, icona: Icona }) => {
          const centrale = href === "/scansiona";
          const selezionata = attiva(href);
          return (
            <li key={href} className="flex justify-center">
              <Link
                href={href}
                aria-current={selezionata ? "page" : undefined}
                className={cn(
                  "flex min-h-14 w-full min-w-12 flex-col items-center justify-center gap-0.5 rounded-full text-sm font-medium tracking-tight transition-colors active:scale-95",
                  centrale
                    ? "text-foreground"
                    : selezionata
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground",
                )}
              >
                {centrale ? (
                  <span className="-mt-7 flex size-16 items-center justify-center rounded-full bg-accento text-accento-foreground shadow-[0_10px_24px_-6px_rgb(106_76_255/0.7)] ring-4 ring-card">
                    <Icona className="size-8" aria-hidden />
                  </span>
                ) : (
                  <Icona className="size-6" aria-hidden />
                )}
                <span>{etichetta}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
