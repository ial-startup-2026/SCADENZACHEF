type Props = { titolo: string; sottotitolo?: string; sopratitolo?: string };

/** Titolo grande e leggero, come nel riferimento: l'attenzione va ai numeri, non al grassetto. */
export function IntestazionePagina({ titolo, sottotitolo, sopratitolo }: Props) {
  return (
    <header className="animazione-entra mb-6">
      {sopratitolo && (
        <p className="mb-1 text-base text-muted-foreground first-letter:uppercase">{sopratitolo}</p>
      )}
      <h1 className="text-4xl font-medium leading-[1.1] tracking-tight">{titolo}</h1>
      {sottotitolo && <p className="mt-2 text-lg text-muted-foreground">{sottotitolo}</p>}
    </header>
  );
}
