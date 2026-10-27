type Props = { titolo: string; sottotitolo?: string; sopratitolo?: string };

export function IntestazionePagina({ titolo, sottotitolo, sopratitolo }: Props) {
  return (
    <header className="animazione-entra mb-6">
      {sopratitolo && (
        <p className="mb-1 text-base font-semibold text-primary first-letter:uppercase">{sopratitolo}</p>
      )}
      <h1 className="text-4xl font-extrabold tracking-tight">{titolo}</h1>
      {sottotitolo && <p className="mt-1 text-muted-foreground">{sottotitolo}</p>}
    </header>
  );
}
