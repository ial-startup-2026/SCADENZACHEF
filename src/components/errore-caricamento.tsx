import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

/** Un errore di lettura non deve sembrare "non c'è niente": si dice chiaramente e si offre di riprovare. */
export function ErroreCaricamento({ cosa, href }: { cosa: string; href: string }) {
  return (
    <section role="alert" className="space-y-3 rounded-3xl border-2 border-destructive bg-card p-5">
      <p className="flex items-center gap-2 text-xl font-bold text-destructive">
        <TriangleAlert className="size-6" aria-hidden />
        Non riesco a caricare {cosa}
      </p>
      <p className="text-muted-foreground">Controlla la connessione e riprova.</p>
      <Link href={href} className={buttonVariants({ size: "lg" }) + " w-full"}>
        Riprova
      </Link>
    </section>
  );
}
