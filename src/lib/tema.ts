export type Tema = "sistema" | "chiaro" | "scuro";

const CHIAVE = "tema";
const ascoltatori = new Set<() => void>();

function leggi(): Tema {
  try {
    const v = localStorage.getItem(CHIAVE);
    return v === "chiaro" || v === "scuro" ? v : "sistema";
  } catch {
    return "sistema";
  }
}

function applica(tema: Tema) {
  const scuro =
    tema === "scuro" ||
    (tema === "sistema" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", scuro);
}

export function impostaTema(tema: Tema) {
  try {
    if (tema === "sistema") localStorage.removeItem(CHIAVE);
    else localStorage.setItem(CHIAVE, tema);
  } catch {
    // Storage non disponibile (navigazione privata): il tema vale solo per questa sessione.
  }
  applica(tema);
  ascoltatori.forEach((fn) => fn());
}

export function iscriviTema(fn: () => void) {
  ascoltatori.add(fn);
  const mq = matchMedia("(prefers-color-scheme: dark)");
  const suCambioSistema = () => {
    if (leggi() === "sistema") applica("sistema");
  };
  mq.addEventListener("change", suCambioSistema);
  return () => {
    ascoltatori.delete(fn);
    mq.removeEventListener("change", suCambioSistema);
  };
}

export const temaCorrente = leggi;
export const temaServer = (): Tema => "sistema";

/**
 * Script inline eseguito prima del primo paint: evita il lampo di tema chiaro
 * quando l'utente ha scelto lo scuro. Deve restare in sintonia con `applica`.
 */
export const SCRIPT_TEMA = `(function(){try{var t=localStorage.getItem('${CHIAVE}');var d=t==='scuro'||(t!=='chiaro'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`;
