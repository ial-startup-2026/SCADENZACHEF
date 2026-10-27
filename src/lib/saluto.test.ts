import { describe, expect, it } from "vitest";
import { dataEstesa, salutoPer } from "./saluto";

// 27 ottobre 2026: ora solare in Italia (UTC+1). Luglio: ora legale (UTC+2).
describe("salutoPer", () => {
  it.each([
    ["2026-10-27T03:59:00Z", "Buonasera"], // 04:59 a Roma
    ["2026-10-27T04:00:00Z", "Buongiorno"], // 05:00
    ["2026-10-27T11:59:00Z", "Buongiorno"], // 12:59
    ["2026-10-27T12:00:00Z", "Buon pomeriggio"], // 13:00
    ["2026-10-27T16:59:00Z", "Buon pomeriggio"], // 17:59
    ["2026-10-27T17:00:00Z", "Buonasera"], // 18:00
  ])("%s → %s (ora solare)", (istante, atteso) => {
    expect(salutoPer(new Date(istante))).toBe(atteso);
  });

  it("segue l'ora legale", () => {
    expect(salutoPer(new Date("2026-07-01T02:59:00Z"))).toBe("Buonasera"); // 04:59 a Roma
    expect(salutoPer(new Date("2026-07-01T03:00:00Z"))).toBe("Buongiorno"); // 05:00 a Roma
  });

  it("usa il fuso del ristorante, non quello del server", () => {
    // 23:30 del 26 ottobre a Roma = 22:30 UTC: sera, anche se in UTC è un altro giorno/ora
    expect(salutoPer(new Date("2026-10-26T22:30:00Z"))).toBe("Buonasera");
  });
});

describe("dataEstesa", () => {
  it("scrive giorno della settimana e mese in italiano", () => {
    expect(dataEstesa(new Date("2026-10-27T10:00:00Z"))).toBe("martedì 27 ottobre");
  });

  it("a mezzanotte vale il giorno di Roma", () => {
    expect(dataEstesa(new Date("2026-10-27T23:30:00Z"))).toBe("mercoledì 28 ottobre");
  });
});
