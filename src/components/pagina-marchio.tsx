import type { ReactNode } from "react";
import { APP_DESCRIPTION, APP_NAME } from "@/config/app";
import { Marchio } from "@/components/marchio";

/** Pagine fuori dall'app (accesso, benvenuto): marchio in alto e scheda bianca col modulo. */
export function PaginaMarchio({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-1 flex-col px-4 pb-10 pt-[max(2.5rem,env(safe-area-inset-top))]">
      <header className="mx-auto mb-6 flex w-full max-w-md items-center gap-4">
        <Marchio className="size-16" />
        <div>
          <p className="text-3xl font-semibold tracking-tight">{APP_NAME}</p>
          <p className="text-muted-foreground">{APP_DESCRIPTION}</p>
        </div>
      </header>
      <div className="mx-auto w-full max-w-md flex-1">
        <div className="animazione-entra rounded-carta bg-card p-6 shadow-carta">{children}</div>
      </div>
    </main>
  );
}
