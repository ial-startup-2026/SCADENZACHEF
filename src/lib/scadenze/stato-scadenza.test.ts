import { describe, expect, it } from "vitest";
import {
  dataBreve,
  aggiungiGiorni,
  dataOggi,
  dettaglioGiorni,
  giorniAllaScadenza,
  statoScadenza,
  testoGiorni,
} from "./stato-scadenza";

const t = (iso: string) => new Date(iso);
// 27 ottobre 2026, 12:00 a Roma (ora solare, UTC+1)
const ADESSO = t("2026-10-27T11:00:00Z");

describe("dataOggi", () => {
  it("usa il giorno di Roma, non quello UTC", () => {
    expect(dataOggi(t("2026-10-27T22:59:59Z"))).toBe("2026-10-27"); // 23:59:59 a Roma
    expect(dataOggi(t("2026-10-27T23:00:00Z"))).toBe("2026-10-28"); // mezzanotte a Roma
  });

  it("segue l'ora legale estiva (UTC+2)", () => {
    expect(dataOggi(t("2026-07-01T21:59:59Z"))).toBe("2026-07-01");
    expect(dataOggi(t("2026-07-01T22:00:00Z"))).toBe("2026-07-02");
  });
});

describe("giorniAllaScadenza", () => {
  it("oggi, domani, ieri", () => {
    expect(giorniAllaScadenza("2026-10-27", ADESSO)).toBe(0);
    expect(giorniAllaScadenza("2026-10-28", ADESSO)).toBe(1);
    expect(giorniAllaScadenza("2026-10-26", ADESSO)).toBe(-1);
  });

  it("non dipende dall'ora del giorno: stesso risultato dalle 00:00 alle 23:59 di Roma", () => {
    for (const iso of ["2026-10-26T23:00:00Z", "2026-10-27T08:00:00Z", "2026-10-27T22:59:00Z"]) {
      expect(giorniAllaScadenza("2026-10-28", t(iso))).toBe(1);
    }
    expect(giorniAllaScadenza("2026-10-28", t("2026-10-27T23:00:00Z"))).toBe(0); // già 28 a Roma
  });

  it("dopo la mezzanotte di Roma ma ancora 'ieri' in UTC conta il giorno di Roma", () => {
    // 00:30 del 28 ottobre a Roma = 23:30 UTC del 27
    expect(giorniAllaScadenza("2026-10-28", t("2026-10-27T23:30:00Z"))).toBe(0);
  });

  describe("cambio ora legale", () => {
    it("fine ora legale 2026-10-25 (giorno di 25 ore): il giorno dopo resta +1", () => {
      expect(giorniAllaScadenza("2026-10-26", t("2026-10-24T22:30:00Z"))).toBe(1); // 00:30 CEST del 25
      expect(giorniAllaScadenza("2026-10-26", t("2026-10-25T23:30:00Z"))).toBe(0); // 00:30 CET del 26
      expect(giorniAllaScadenza("2026-10-25", t("2026-10-25T00:30:00Z"))).toBe(0); // 02:30 CEST (prima dell'ora doppia)
      expect(giorniAllaScadenza("2026-10-25", t("2026-10-25T01:30:00Z"))).toBe(0); // 02:30 CET (ora ripetuta)
    });

    it("inizio ora legale 2026-03-29 (giorno di 23 ore): nessun giorno saltato o duplicato", () => {
      expect(giorniAllaScadenza("2026-03-30", t("2026-03-28T23:30:00Z"))).toBe(1); // 00:30 CET del 29
      expect(giorniAllaScadenza("2026-03-30", t("2026-03-29T22:30:00Z"))).toBe(0); // 00:30 CEST del 30
      expect(giorniAllaScadenza("2026-03-29", t("2026-03-29T01:30:00Z"))).toBe(0); // 03:30 CEST, dopo il salto
    });

    it("attraverso il cambio ora il conteggio resta esatto", () => {
      // 20 ottobre → 30 ottobre sono sempre 10 giorni, anche se in mezzo c'è un giorno da 25 ore
      expect(giorniAllaScadenza("2026-10-30", t("2026-10-20T10:00:00Z"))).toBe(10);
      expect(giorniAllaScadenza("2026-03-31", t("2026-03-25T10:00:00Z"))).toBe(6);
    });
  });

  it("fine mese, fine anno e anno bisestile", () => {
    expect(giorniAllaScadenza("2027-01-01", t("2026-12-31T10:00:00Z"))).toBe(1);
    expect(giorniAllaScadenza("2028-03-01", t("2028-02-28T10:00:00Z"))).toBe(2); // 29 febbraio 2028 esiste
    expect(giorniAllaScadenza("2027-03-01", t("2027-02-28T10:00:00Z"))).toBe(1);
  });

  it("rifiuta formati e date che non esistono", () => {
    expect(() => giorniAllaScadenza("27/10/2026", ADESSO)).toThrow(/non valida/);
    expect(() => giorniAllaScadenza("2026-10-27T10:00:00Z", ADESSO)).toThrow(/non valida/);
    expect(() => giorniAllaScadenza("2026-02-30", ADESSO)).toThrow(/inesistente/);
    expect(() => giorniAllaScadenza("2026-13-01", ADESSO)).toThrow(/inesistente/);
  });

  it("il risultato non dipende dal fuso della macchina", () => {
    const prima = process.env.TZ;
    for (const tz of ["UTC", "America/Los_Angeles", "Asia/Tokyo"]) {
      process.env.TZ = tz;
      expect(giorniAllaScadenza("2026-10-28", t("2026-10-27T11:00:00Z"))).toBe(1);
    }
    process.env.TZ = prima;
  });
});

describe("statoScadenza (soglie di default 7 e 3)", () => {
  const stato = (data: string) => statoScadenza(data, ADESSO).stato;

  it.each([
    ["2026-10-20", "scaduto"], // -7
    ["2026-10-26", "scaduto"], // ieri
    ["2026-10-27", "oggi"],
    ["2026-10-28", "attenzione"], // 1
    ["2026-10-29", "attenzione"], // 2
    ["2026-10-30", "attenzione"], // 3
    ["2026-10-31", "in-scadenza"], // 4
    ["2026-11-02", "in-scadenza"], // 6
    ["2026-11-03", "in-scadenza"], // 7
    ["2026-11-04", "ok"], // 8
    ["2027-10-27", "ok"],
  ])("%s → %s", (data, atteso) => {
    expect(stato(data)).toBe(atteso);
  });

  it("restituisce anche i giorni", () => {
    expect(statoScadenza("2026-11-03", ADESSO)).toEqual({ stato: "in-scadenza", giorni: 7 });
    expect(statoScadenza("2026-10-25", ADESSO)).toEqual({ stato: "scaduto", giorni: -2 });
  });

  it("scade oggi a fine giornata resta 'oggi', non 'scaduto'", () => {
    expect(statoScadenza("2026-10-27", t("2026-10-27T22:59:00Z")).stato).toBe("oggi"); // 23:59 a Roma
    expect(statoScadenza("2026-10-27", t("2026-10-27T23:00:00Z")).stato).toBe("scaduto"); // mezzanotte
  });

  it("cambia stato esattamente a mezzanotte di Roma", () => {
    expect(statoScadenza("2026-10-31", t("2026-10-26T22:59:00Z")).stato).toBe("in-scadenza"); // 4 gg
    expect(statoScadenza("2026-10-31", t("2026-10-26T23:00:00Z")).stato).toBe("in-scadenza"); // 27 ott 00:00 → 4 gg
    expect(statoScadenza("2026-10-31", t("2026-10-27T23:00:00Z")).stato).toBe("attenzione"); // 28 ott → 3 gg
  });

  describe("soglie personalizzate", () => {
    it("giallo 10, arancione 5", () => {
      const s = { giallo: 10, arancione: 5 };
      expect(statoScadenza("2026-11-01", ADESSO, s).stato).toBe("attenzione"); // 5
      expect(statoScadenza("2026-11-02", ADESSO, s).stato).toBe("in-scadenza"); // 6
      expect(statoScadenza("2026-11-06", ADESSO, s).stato).toBe("in-scadenza"); // 10
      expect(statoScadenza("2026-11-07", ADESSO, s).stato).toBe("ok"); // 11
    });

    it("arancione 1: solo domani è 'attenzione'", () => {
      const s = { giallo: 2, arancione: 1 };
      expect(statoScadenza("2026-10-28", ADESSO, s).stato).toBe("attenzione");
      expect(statoScadenza("2026-10-29", ADESSO, s).stato).toBe("in-scadenza");
      expect(statoScadenza("2026-10-30", ADESSO, s).stato).toBe("ok");
    });
  });
});

describe("testi", () => {
  it.each([
    [0, "Scade oggi"],
    [1, "Scade domani"],
    [5, "Scade tra 5 giorni"],
    [-1, "Scaduto ieri"],
    [-3, "Scaduto da 3 giorni"],
  ])("testoGiorni(%i) → %s", (giorni, atteso) => {
    expect(testoGiorni(giorni)).toBe(atteso);
  });

  it("dettaglioGiorni non ripete quello che dice il chip", () => {
    expect(dettaglioGiorni("scaduto", -1)).toBe("ieri");
    expect(dettaglioGiorni("scaduto", -3)).toBe("da 3 giorni");
    expect(dettaglioGiorni("oggi", 0)).toBeNull();
    expect(dettaglioGiorni("attenzione", 1)).toBe("Scade domani");
    expect(dettaglioGiorni("in-scadenza", 5)).toBe("Scade tra 5 giorni");
    expect(dettaglioGiorni("ok", 45)).toBe("Scade tra 45 giorni");
  });

  it("dataBreve scrive giorno e mese in italiano, l'anno solo se diverso", () => {
    expect(dataBreve("2026-11-01", ADESSO)).toBe("dom 1 nov");
    expect(dataBreve("2027-01-15", ADESSO)).toContain("2027");
  });
});

describe("aggiungiGiorni", () => {
  it("somma e sottrae giorni di calendario, anche a cavallo di mese, anno e ora legale", () => {
    expect(aggiungiGiorni("2026-10-27", 0)).toBe("2026-10-27");
    expect(aggiungiGiorni("2026-10-27", 5)).toBe("2026-11-01");
    expect(aggiungiGiorni("2026-12-31", 1)).toBe("2027-01-01");
    expect(aggiungiGiorni("2028-02-28", 1)).toBe("2028-02-29");
    expect(aggiungiGiorni("2026-10-27", -3)).toBe("2026-10-24");
    expect(aggiungiGiorni("2026-10-24", 3)).toBe("2026-10-27"); // attraversa la fine dell'ora legale
  });

  it("rifiuta date che non esistono", () => {
    expect(() => aggiungiGiorni("2026-02-30", 1)).toThrow();
  });
});
