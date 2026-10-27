import Link from "next/link";
import { APP_NAME } from "@/config/app";
import { Marchio } from "@/components/marchio";
import { iniziali } from "@/lib/foto-profilo";

/** Barra in alto a pillola: marchio e nome a sinistra, il tuo profilo a destra. */
export function BarraSuperiore({ nome }: { nome: string }) {
  return (
    <header className="mb-6 flex items-center justify-between rounded-full bg-card p-1.5 shadow-carta">
      <Link href="/" aria-label={`${APP_NAME}: vai alla Home`} className="flex items-center gap-2.5 rounded-full py-0.5 pr-3">
        <Marchio className="size-11" />
        <span className="text-xl font-semibold tracking-tight">{APP_NAME}</span>
      </Link>
      <Link
        href="/profilo"
        aria-label={`Profilo di ${nome}`}
        className="flex size-12 items-center justify-center rounded-full bg-secondary text-base font-semibold"
      >
        {iniziali(nome)}
      </Link>
    </header>
  );
}
