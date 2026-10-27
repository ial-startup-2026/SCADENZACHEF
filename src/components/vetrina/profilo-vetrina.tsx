import { Avatar } from "@/components/avatar";
import { IntestazionePagina } from "@/components/intestazione-pagina";
import { SelettoreTema } from "@/components/selettore-tema";

/** Profilo della vetrina: solo il selettore del tema, senza dati né account. */
export function ProfiloVetrina() {
  return (
    <>
      <IntestazionePagina titolo="Profilo" />
      <section className="mb-8 flex items-center gap-4">
        <Avatar nome="Marta Rossi" className="size-20 text-2xl" />
        <div>
          <p className="text-xl font-semibold">Marta Rossi</p>
          <p className="text-muted-foreground">Admin · Trattoria Demo</p>
        </div>
      </section>
      <section className="mb-8 space-y-3">
        <h2 className="text-xl font-medium">Aspetto</h2>
        <SelettoreTema />
      </section>
      <p className="rounded-carta bg-card p-5 text-lg shadow-carta">
        Nella versione completa trovi qui anche la squadra con i codici d&apos;invito, le soglie di scadenza e l&apos;accesso con email e password.
      </p>
    </>
  );
}
