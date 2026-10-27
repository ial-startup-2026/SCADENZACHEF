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
      className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl border-t border-border bg-card pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_-14px_rgb(0_0_0/0.25)]"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5 items-end">
        {VOCI.map(({ href, etichetta, icona: Icona }) => {
          const centrale = href === "/scansiona";
          const selezionata = attiva(href);
          return (
            <li key={href} className="flex justify-center">
              <Link
                href={href}
                aria-current={selezionata ? "page" : undefined}
                className={cn(
                  "flex min-h-16 w-full min-w-12 flex-col items-center justify-center gap-0.5 text-sm font-medium transition-transform active:scale-95",
                  selezionata || centrale ? "text-primary" : "text-muted-foreground",
                )}
              >
                {centrale ? (
                  <span className="sfondo-hero -mt-8 flex size-16 items-center justify-center rounded-full text-hero-fg shadow-[0_10px_24px_-6px_rgb(31_90_63/0.6)] ring-4 ring-background">
                    <Icona className="size-8" aria-hidden />
                  </span>
                ) : (
                  // La voce attiva ha una "pillola" dietro l'icona e il testo in grassetto: non solo colore.
                  <span
                    className={cn(
                      "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                      selezionata && "bg-primary-soft",
                    )}
                  >
                    <Icona className="size-6" aria-hidden />
                  </span>
                )}
                <span className={cn(selezionata && "font-bold")}>{etichetta}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
