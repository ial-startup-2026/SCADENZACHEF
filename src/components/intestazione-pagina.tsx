type Props = { titolo: string; sottotitolo?: string };

export function IntestazionePagina({ titolo, sottotitolo }: Props) {
  return (
    <header className="mb-6">
      <h1 className="text-3xl font-extrabold tracking-tight">{titolo}</h1>
      {sottotitolo && <p className="mt-1 text-muted-foreground">{sottotitolo}</p>}
    </header>
  );
}
