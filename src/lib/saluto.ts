import { LOCALE, TIMEZONE } from "@/config/app";

function oraIn(tz: string, quando: Date): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone: tz }).format(quando),
  );
}

/** Saluto in base all'ora locale del ristorante (non quella del server). */
export function salutoPer(quando: Date, tz: string = TIMEZONE): string {
  const ora = oraIn(tz, quando);
  if (ora >= 5 && ora < 13) return "Buongiorno";
  if (ora >= 13 && ora < 18) return "Buon pomeriggio";
  return "Buonasera";
}

/** "martedì 27 ottobre" nel fuso del ristorante. */
export function dataEstesa(quando: Date, tz: string = TIMEZONE): string {
  return new Intl.DateTimeFormat(LOCALE, { weekday: "long", day: "numeric", month: "long", timeZone: tz }).format(quando);
}
