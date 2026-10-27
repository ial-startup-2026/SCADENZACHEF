import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { COLORI_PWA } from "@/config/app";
import { STATI_SCADENZA } from "@/lib/costanti/stati-scadenza";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

function blocco(selettore: string): Record<string, string> {
  const inizio = css.indexOf(`${selettore} {`);
  const fine = css.indexOf("\n}", inizio);
  const mappa: Record<string, string> = {};
  for (const m of css.slice(inizio, fine).matchAll(/--([\w-]+):\s*(#[0-9a-f]{6});/gi)) {
    mappa[m[1]] = m[2].toLowerCase();
  }
  return mappa;
}

function luminanza(hex: string) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrasto(a: string, b: string) {
  const [alta, bassa] = [luminanza(a), luminanza(b)].sort((x, y) => y - x);
  return (alta + 0.05) / (bassa + 0.05);
}

const TEMI = { chiaro: blocco(":root"), scuro: blocco(".dark") };

describe.each(Object.entries(TEMI))("token tema %s", (nome, t) => {
  const COPPIE: [string, string][] = [
    ["foreground", "background"],
    ["card-foreground", "card"],
    ["primary-foreground", "primary"],
    ["secondary-foreground", "secondary"],
    ["muted-foreground", "background"],
    ["muted-foreground", "card"],
    ["accent-foreground", "accent"],
    ["primary", "background"],
    ["destructive", "background"],
    ...STATI_SCADENZA.map((s): [string, string] => [`stato-${s}-fg`, `stato-${s}-bg`]),
  ];

  it.each(COPPIE)("%s su %s ha contrasto AA (>= 4.5)", (fg, bg) => {
    expect(t[fg], `manca --${fg}`).toBeDefined();
    expect(t[bg], `manca --${bg}`).toBeDefined();
    expect(contrasto(t[fg], t[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it("i bordi dei campi hanno contrasto >= 3 con lo sfondo", () => {
    expect(contrasto(t.input, t.card)).toBeGreaterThanOrEqual(3);
  });

  it("i colori del semaforo sono tutti distinti", () => {
    const sfondi = STATI_SCADENZA.map((s) => t[`stato-${s}-bg`]);
    expect(new Set(sfondi).size).toBe(STATI_SCADENZA.length);
  });

  it(`i colori PWA (${nome}) coincidono con i token`, () => {
    const pwa = COLORI_PWA[nome as "chiaro" | "scuro"];
    expect(pwa.sfondo).toBe(t.background);
    if (nome === "chiaro") expect(pwa.tema).toBe(t.primary);
  });
});
