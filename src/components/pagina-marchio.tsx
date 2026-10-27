import type { ReactNode } from "react";
import { APP_DESCRIPTION, APP_NAME } from "@/config/app";
import { Marchio } from "@/components/marchio";

/** Pagine fuori dall'app (accesso, benvenuto): testata con il marchio e scheda bianca col modulo. */
export function PaginaMarchio({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-1 flex-col">
      <header className="sfondo-hero relative overflow-hidden rounded-b-[2rem] px-6 pb-16 pt-[max(2.5rem,env(safe-area-inset-top))] text-hero-fg">
        {/* Cerchi decorativi: solo ornamento */}
        <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 size-44 rounded-full bg-white/10" />
        <span aria-hidden className="pointer-events-none absolute -bottom-12 left-6 size-32 rounded-full bg-white/[0.07]" />
        <div className="relative mx-auto flex max-w-md items-center gap-4">
          <Marchio className="size-16 rounded-[22%] shadow-lg ring-2 ring-white/50" />
          <div>
            <p className="font-display text-3xl font-extrabold tracking-tight">{APP_NAME}</p>
            <p className="text-base">{APP_DESCRIPTION}</p>
          </div>
        </div>
      </header>
      <div className="mx-auto -mt-8 w-full max-w-md flex-1 px-4 pb-10">
        <div className="animazione-entra rounded-3xl bg-card p-5 shadow-carta">{children}</div>
      </div>
    </main>
  );
}
