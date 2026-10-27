import type { Metadata } from "next";
import Link from "next/link";
import { Camera, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { StatoVuoto } from "@/components/stato-vuoto";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Scansiona" };

export default function ScansionaPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="flex-1">
        <StatoVuoto
          icona={Camera}
          titolo="Scansione in arrivo"
          descrizione="Qui inquadrerai l'etichetta e i dati si compileranno da soli."
        />
      </div>
      <Link
        href="/"
        className={cn(buttonVariants({ variant: "outline", size: "lg" }), "mt-6 w-full")}
      >
        <X aria-hidden />
        Chiudi
      </Link>
    </main>
  );
}
