// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { salvaPreferenze } from "@/lib/scan/preferenze";
import type { EsitoLettura, ServiziScansione } from "@/lib/scan/tipi";
import { Scansione } from "./scansione";

const push = vi.hoisted(() => vi.fn());
const toast = vi.hoisted(() => Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("sonner", () => ({ toast }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...resto }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...resto}>
      {children}
    </a>
  ),
}));

const buona: EsitoLettura = {
  ok: true,
  origine: "ai",
  lettura: {
    nome: "Burrata di Andria",
    data_scadenza: "2026-11-02",
    lotto: "L2611B",
    allergeni: ["latte"],
    quantita: 125,
    unita: "g",
    confidenza: { nome: 0.97, data_scadenza: 0.95, lotto: 0.9, allergeni: 0.92, quantita: 0.95, globale: 0.94 },
  },
};

const dubbia: EsitoLettura = {
  ok: true,
  origine: "ai",
  lettura: { ...buona.lettura, confidenza: { ...buona.lettura.confidenza, data_scadenza: 0.4, allergeni: 0.3, globale: 0.6 } },
};

const fallita: EsitoLettura = { ok: false, motivo: "risposta_non_valida" };

let servizi: ServiziScansione;
let rispondi: (e: EsitoLettura) => void;

beforeEach(() => {
  push.mockClear();
  for (const f of [toast, toast.success, toast.error, toast.warning]) f.mockClear();
  salvaPreferenze({ posizione: "cella_frigo", categoria: "altro", continua: false });
  URL.createObjectURL = vi.fn(() => "blob:anteprima");
  URL.revokeObjectURL = vi.fn();
  servizi = {
    comprimi: vi.fn(async (f: Blob) => f),
    leggi: vi.fn(() => new Promise<EsitoLettura>((ok) => (rispondi = ok))),
    salva: vi.fn(async () => ({ ok: true as const, prodottoId: "p1" })),
  };
});

const foto = () => new File(["x"], "etichetta.jpg", { type: "image/jpeg" });
const ingressoFotocamera = (c: HTMLElement) => c.querySelector<HTMLInputElement>("input[capture]")!;
const scatta = async (c: HTMLElement) => {
  await act(async () => {
    fireEvent.change(ingressoFotocamera(c), { target: { files: [foto()] } });
  });
};
const leggiCon = async (esito: EsitoLettura) => {
  await waitFor(() => expect(screen.getByText(/Sto leggendo/)).toBeInTheDocument());
  await act(async () => rispondi(esito));
};

describe("Scansione", () => {
  it("parte dalla cattura, con la fotocamera e la galleria", () => {
    const { container } = render(<Scansione servizi={servizi} />);
    expect(screen.getByRole("button", { name: /Scatta una foto/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Scegli dalla galleria/ })).toBeInTheDocument();
    expect(ingressoFotocamera(container)).toHaveAttribute("capture", "environment");
    expect(screen.getByRole("link", { name: "Chiudi" })).toBeInTheDocument();
  });

  it("foto → lettura → dati precompilati → un tocco per salvare", async () => {
    const utente = userEvent.setup();
    const { container } = render(<Scansione servizi={servizi} />);
    await scatta(container);
    expect(servizi.comprimi).toHaveBeenCalled();
    await leggiCon(buona);

    expect(screen.getByText("Letto. Controlla e salva.")).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue("Burrata di Andria");
    expect(screen.getByLabelText("Scadenza")).toHaveValue("2026-11-02");
    expect(screen.getByLabelText("Lotto (facoltativo)")).toHaveValue("L2611B");
    expect(within(screen.getByRole("group", { name: "Allergeni" })).getByRole("button", { name: /Latte/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("Da controllare")).not.toBeInTheDocument();

    await utente.click(screen.getByRole("button", { name: "Salva in magazzino" }));
    expect(servizi.salva).toHaveBeenCalledTimes(1);
    const [dati, fotoInviata] = vi.mocked(servizi.salva).mock.calls[0];
    expect(dati).toMatchObject({
      nome: "Burrata di Andria",
      data_scadenza: "2026-11-02",
      lotto: "L2611B",
      allergeni: ["latte"],
      posizione: "cella_frigo",
      quantita: 125,
      unita: "g",
    });
    expect(dati.clientUuid).toMatch(/^[0-9a-f-]{36}$/);
    expect(fotoInviata).toBeInstanceOf(Blob);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/magazzino"));
  });

  it("mostra sempre l'avviso sugli allergeni", async () => {
    const { container } = render(<Scansione servizi={servizi} />);
    await scatta(container);
    await leggiCon(buona);
    expect(screen.getByText(/Verifica sempre l'etichetta originale prima di servire un cliente allergico/)).toBeInTheDocument();
  });

  it("lettura poco sicura: avviso chiaro e campi segnati 'Da controllare'", async () => {
    const { container } = render(<Scansione servizi={servizi} />);
    await scatta(container);
    await leggiCon(dubbia);

    expect(screen.getByRole("alert", { name: "" })).toBeInTheDocument();
    expect(screen.getByText(/Non sono sicuro di alcuni dati/)).toBeInTheDocument();
    expect(screen.getAllByText("Da controllare").length).toBeGreaterThanOrEqual(2); // scadenza e allergeni
    expect(screen.getByText(/Non ho letto bene gli ingredienti/)).toBeInTheDocument();
  });

  it("lettura fallita: avviso chiaro, campi vuoti e inserimento a mano con data semplice", async () => {
    const utente = userEvent.setup();
    const { container } = render(<Scansione servizi={servizi} />);
    await scatta(container);
    await leggiCon(fallita);

    expect(screen.getByText(/Non sono riuscito a leggere l'etichetta\. Compila i dati a mano/)).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue("");
    expect(screen.getByLabelText("Scadenza")).toHaveAttribute("type", "date");

    await utente.type(screen.getByLabelText("Nome"), "Ricotta");
    fireEvent.change(screen.getByLabelText("Scadenza"), { target: { value: "2026-11-20" } });
    await utente.click(screen.getByRole("button", { name: "Salva in magazzino" }));
    expect(servizi.salva).toHaveBeenCalledWith(expect.objectContaining({ nome: "Ricotta", data_scadenza: "2026-11-20", quantita: 1, unita: "pz" }), expect.anything());
  });

  it("dice se il servizio di lettura non è attivo", async () => {
    const { container } = render(<Scansione servizi={servizi} />);
    await scatta(container);
    await leggiCon({ ok: false, motivo: "non_configurato" });
    expect(screen.getByText(/La lettura automatica non è attiva\. Compila i dati a mano/)).toBeInTheDocument();
  });

  it("non salva senza nome o senza scadenza, e lo dice", async () => {
    const utente = userEvent.setup();
    const { container } = render(<Scansione servizi={servizi} />);
    await scatta(container);
    await leggiCon(fallita);

    await utente.click(screen.getByRole("button", { name: "Salva in magazzino" }));
    expect(servizi.salva).not.toHaveBeenCalled();
    expect(await screen.findByText("Scrivi il nome del prodotto.")).toBeInTheDocument();

    await utente.type(screen.getByLabelText("Nome"), "Ricotta");
    await utente.click(screen.getByRole("button", { name: "Salva in magazzino" }));
    expect(servizi.salva).not.toHaveBeenCalled();
    expect(screen.getByText("Scegli una data valida.")).toBeInTheDocument();
  });

  it("un errore di salvataggio resta in vista e il nuovo tentativo usa lo stesso identificativo (niente doppioni)", async () => {
    const utente = userEvent.setup();
    servizi.salva = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, errore: "Sei offline? Riprova." })
      .mockResolvedValueOnce({ ok: true, prodottoId: "p1" });
    const { container } = render(<Scansione servizi={servizi} />);
    await scatta(container);
    await leggiCon(buona);

    await utente.click(screen.getByRole("button", { name: "Salva in magazzino" }));
    expect(await screen.findByText("Sei offline? Riprova.")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();

    await utente.click(screen.getByRole("button", { name: "Salva in magazzino" }));
    await waitFor(() => expect(push).toHaveBeenCalled());
    const [primo, secondo] = vi.mocked(servizi.salva).mock.calls.map(([d]) => d.clientUuid);
    expect(primo).toBe(secondo);
  });

  it("la quantità si può scrivere a mano", async () => {
    const utente = userEvent.setup();
    const { container } = render(<Scansione servizi={servizi} />);
    await scatta(container);
    await leggiCon(buona);

    const campo = screen.getByLabelText("Quantità: scrivi il valore");
    await utente.clear(campo);
    await utente.type(campo, "2,5");
    await utente.click(screen.getByRole("button", { name: "Salva in magazzino" }));
    expect(servizi.salva).toHaveBeenCalledWith(expect.objectContaining({ quantita: 2.5 }), expect.anything());
  });

  it("scansione continua: dopo il salvataggio resta sulla fotocamera e ricorda le scelte", async () => {
    const utente = userEvent.setup();
    const { container } = render(<Scansione servizi={servizi} />);
    await utente.click(screen.getByRole("switch", { name: /Scansione continua/ }));
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");

    await scatta(container);
    await leggiCon(buona);
    await utente.click(within(screen.getByRole("group", { name: "Posizione" })).getByRole("button", { name: "Freezer" }));
    await utente.click(screen.getByRole("button", { name: "Salva in magazzino" }));

    await waitFor(() => expect(screen.getByRole("button", { name: /Scatta una foto/ })).toBeInTheDocument());
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByText(/Aggiunti in questa sessione \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Burrata di Andria/)).toBeInTheDocument();

    // Il prodotto dopo parte dall'ultima posizione usata
    await scatta(container);
    await leggiCon(buona);
    expect(within(screen.getByRole("group", { name: "Posizione" })).getByRole("button", { name: "Freezer" })).toHaveAttribute("aria-pressed", "true");
  });

  it("'Scrivi a mano' durante la lettura la abbandona: la risposta in ritardo si ignora", async () => {
    const utente = userEvent.setup();
    const { container } = render(<Scansione servizi={servizi} />);
    await scatta(container);
    await waitFor(() => expect(screen.getByText(/Sto leggendo/)).toBeInTheDocument());

    await utente.click(screen.getByRole("button", { name: /Scrivi a mano/ }));
    expect(screen.getByLabelText("Nome")).toHaveValue("");

    await act(async () => rispondi(buona)); // arriva tardi
    expect(screen.getByLabelText("Nome")).toHaveValue(""); // non sovrascrive quello che si sta scrivendo
  });

  it("senza foto: 'Inserisci a mano' porta al modulo vuoto e salva senza foto", async () => {
    const utente = userEvent.setup();
    render(<Scansione servizi={servizi} />);
    await utente.click(screen.getByRole("button", { name: /Inserisci a mano/ }));
    await utente.type(screen.getByLabelText("Nome"), "Basilico");
    fireEvent.change(screen.getByLabelText("Scadenza"), { target: { value: "2026-11-05" } });
    await utente.click(screen.getByRole("button", { name: "Salva in magazzino" }));
    expect(servizi.salva).toHaveBeenCalledWith(expect.objectContaining({ nome: "Basilico" }), null);
  });

  it("segnala un avviso del salvataggio (es. foto non salvata) senza perdere il prodotto", async () => {
    const utente = userEvent.setup();
    servizi.salva = vi.fn(async () => ({ ok: true as const, prodottoId: "p1", avviso: "Il prodotto è salvato, ma non la foto." }));
    const { container } = render(<Scansione servizi={servizi} />);
    await scatta(container);
    await leggiCon(buona);
    await utente.click(screen.getByRole("button", { name: "Salva in magazzino" }));
    await waitFor(() => expect(toast.warning).toHaveBeenCalledWith("Il prodotto è salvato, ma non la foto."));
    expect(push).toHaveBeenCalled();
  });

  it("la foto che non si riesce a ridurre non blocca l'app", async () => {
    servizi.comprimi = vi.fn(async () => {
      throw new Error("immagine rotta");
    });
    const { container } = render(<Scansione servizi={servizi} />);
    await scatta(container);
    expect(toast.error).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Scatta una foto/ })).toBeInTheDocument();
  });
});
