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

export function TabBar() {
  const pathname = usePathname();
  const attiva = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      aria-label="Navigazione principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5 items-end px-2">
        {VOCI.map(({ href, etichetta, icona: Icona }) => {
          const centrale = href === "/scansiona";
          const selezionata = attiva(href);
          return (
            <li key={href} className="flex justify-center">
              <Link
                href={href}
                aria-current={selezionata ? "page" : undefined}
                className={cn(
                  "relative flex min-h-16 w-full min-w-12 flex-col items-center justify-center gap-0.5 text-sm font-medium",
                  centrale
                    ? "text-primary"
                    : selezionata
                      ? "text-primary"
                      : "text-muted-foreground",
                )}
              >
                {centrale ? (
                  <span className="-mt-7 flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background">
                    <Icona className="size-8" aria-hidden />
                  </span>
                ) : (
                  <>
                    {selezionata && (
                      <span
                        aria-hidden
                        className="absolute inset-x-4 top-0 h-1 rounded-b-full bg-primary"
                      />
                    )}
                    <Icona className="size-6" aria-hidden />
                  </>
                )}
                <span className={cn(selezionata && "font-bold")}>
                  {etichetta}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
