// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProdottoMagazzino } from "@/lib/supabase/tipi";
import { SOGLIE_DEFAULT } from "@/lib/scadenze/soglie";
import { Catalogo, type AzioniCatalogo } from "./catalogo";

const toast = vi.hoisted(() => Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...resto }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...resto}>
      {children}
    </a>
  ),
}));

const ADESSO = "2026-10-27T11:00:00Z"; // 27 ottobre, 12:00 a Roma

const prodotto = (id: number, nome: string, scadenza: string, over: Partial<ProdottoMagazzino> = {}): ProdottoMagazzino => ({
  id: `00000000-0000-4000-8000-${String(id).padStart(12, "0")}`,
  nome,
  categoria: "latticini",
  posizione: "cella_frigo",
  quantita: 4,
  unita: "pz",
  data_scadenza: scadenza,
  lotto: null,
  allergeni: [],
  stato: "attivo",
  creato_il: "2026-10-01T10:00:00Z",
  ...over,
});

const PRODOTTI = [
  prodotto(1, "Farina", "2027-02-01", { categoria: "secco", posizione: "dispensa_secca", allergeni: ["glutine"] }),
  prodotto(2, "Panna", "2026-10-24", { allergeni: ["latte"] }),
  prodotto(3, "Burrata", "2026-10-28", { quantita: 6, allergeni: ["latte"] }),
  prodotto(4, "Pollo", "2026-10-27", { categoria: "carne" }),
];

let azioni: AzioniCatalogo;

beforeEach(() => {
  toast.mockClear();
  azioni = {
    scarica: vi.fn(async ({ quantita }) => ({
      ok: true as const,
      movimentoId: "mov-1",
      quantita: quantita === null ? 0 : 6 - quantita,
      stato: quantita === null ? ("finito" as const) : ("attivo" as const),
    })),
    annulla: vi.fn(async () => ({ ok: true as const, quantita: 6, stato: "attivo" as const })),
    modifica: vi.fn(),
  };
});

const montaggio = () => render(<Catalogo prodotti={PRODOTTI} soglie={SOGLIE_DEFAULT} adessoIso={ADESSO} azioni={azioni} />);
const nomiInLista = () => screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);

describe("Catalogo", () => {
  it("mostra i prodotti in ordine FEFO", () => {
    montaggio();
    expect(nomiInLista()).toEqual(["Panna", "Pollo", "Burrata", "Farina"]);
  });

  it("filtra con le chip e con la ricerca", async () => {
    const utente = userEvent.setup();
    montaggio();

    await utente.click(screen.getByRole("button", { name: "Scaduti" }));
    expect(nomiInLista()).toEqual(["Panna"]);

    await utente.click(screen.getByRole("button", { name: "Scade presto" }));
    expect(nomiInLista()).toEqual(["Pollo", "Burrata"]);

    await utente.click(screen.getByRole("button", { name: "Tutti" }));
    await utente.type(screen.getByRole("searchbox", { name: "Cerca un prodotto" }), "BURR");
    expect(nomiInLista()).toEqual(["Burrata"]);
  });

  it("dice chiaramente quando nessun prodotto corrisponde e permette di azzerare", async () => {
    const utente = userEvent.setup();
    montaggio();
    await utente.type(screen.getByRole("searchbox"), "zzz");
    expect(screen.getByText("Nessun prodotto trovato")).toBeInTheDocument();
    await utente.click(screen.getByRole("button", { name: "Azzera i filtri" }));
    expect(nomiInLista()).toHaveLength(4);
  });

  it("mostra l'invito a scansionare se il magazzino è vuoto", () => {
    render(<Catalogo prodotti={[]} soglie={SOGLIE_DEFAULT} adessoIso={ADESSO} azioni={azioni} />);
    expect(screen.getByText("Il magazzino è vuoto")).toBeInTheDocument();
  });

  it("Usato/Finito: chiede conferma, aggiorna la lista, offre Annulla e lo esegue", async () => {
    const utente = userEvent.setup();
    montaggio();

    await utente.click(screen.getByRole("button", { name: /Burrata, Scade domani/ }));
    await utente.click(await screen.findByRole("button", { name: "Usato / Finito" }));
    // Nessuna chiamata finché non si conferma nel foglio della quantità.
    expect(azioni.scarica).not.toHaveBeenCalled();

    await utente.click(await screen.findByRole("button", { name: "Finito: usa tutto" }));
    expect(azioni.scarica).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: "scarico", quantita: null, motivo: null, prodottoId: PRODOTTI[2].id }),
    );
    await waitFor(() => expect(nomiInLista()).not.toContain("Burrata"));

    // Toast con "Annulla" per 6 secondi
    await waitFor(() => expect(toast).toHaveBeenCalled());
    const [messaggio, opzioni] = toast.mock.calls[0];
    expect(messaggio).toBe("Burrata: finito");
    expect(opzioni.duration).toBe(6000);

    opzioni.action.onClick();
    await waitFor(() => expect(azioni.annulla).toHaveBeenCalledWith("mov-1"));
    await waitFor(() => expect(nomiInLista()).toContain("Burrata"));
  });

  it("Buttato: richiede il motivo prima di poter confermare", async () => {
    const utente = userEvent.setup();
    montaggio();

    await utente.click(screen.getByRole("button", { name: /Panna, Scaduto/ }));
    await utente.click(await screen.findByRole("button", { name: "Buttato" }));

    const conferma = await screen.findByRole("button", { name: "Butta tutto" });
    expect(conferma).toBeDisabled();
    await utente.click(within(screen.getByRole("group", { name: "Motivo" })).getByRole("button", { name: "Scaduto" }));
    expect(conferma).toBeEnabled();

    await utente.click(conferma);
    expect(azioni.scarica).toHaveBeenCalledWith(expect.objectContaining({ tipo: "spreco", motivo: "scaduto", quantita: null }));
    await waitFor(() => expect(nomiInLista()).not.toContain("Panna"));
  });

  it("se il server rifiuta, la lista torna com'era e compare l'errore", async () => {
    const utente = userEvent.setup();
    azioni.scarica = vi.fn(async () => ({ ok: false as const, errore: "Questo prodotto è già stato scaricato." }));
    montaggio();

    await utente.click(screen.getByRole("button", { name: /Pollo, Scade oggi/ }));
    await utente.click(await screen.findByRole("button", { name: "Usato / Finito" }));
    await utente.click(await screen.findByRole("button", { name: "Finito: usa tutto" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Questo prodotto è già stato scaricato."));
    expect(nomiInLista()).toContain("Pollo");
  });

  it("uno scarico parziale lascia il prodotto in lista con la quantità rimasta", async () => {
    const utente = userEvent.setup();
    montaggio();

    await utente.click(screen.getByRole("button", { name: /Burrata, Scade domani/ }));
    await utente.click(await screen.findByRole("button", { name: "Usato / Finito" }));
    await utente.click(await screen.findByRole("button", { name: "½" })); // 3 di 6
    await utente.click(await screen.findByRole("button", { name: "Usato 3 pz" }));

    expect(azioni.scarica).toHaveBeenCalledWith(expect.objectContaining({ quantita: 3 }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith("Usati 3 pz di Burrata", expect.anything()));
    expect(nomiInLista()).toContain("Burrata");
  });
});
