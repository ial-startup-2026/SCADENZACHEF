import type { Registro } from "./operazioni";
import { prodottiDemo } from "./prodotti";

let registro: Registro | null = null;

/**
 * Magazzino di prova tenuto nel browser, condiviso tra le schermate della vetrina statica
 * (catalogo e scansione): un prodotto aggiunto con la scansione compare nel catalogo.
 * Si azzera ricaricando la pagina.
 */
export function registroClient(): Registro {
  return (registro ??= { prodotti: prodottiDemo(new Date().toISOString()), movimenti: new Map() });
}
