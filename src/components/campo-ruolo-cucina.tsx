import { Campo } from "@/components/campo";
import { RUOLI_CUCINA } from "@/lib/costanti/ruoli";

/** Ruolo in cucina: testo libero con suggerimenti. */
export function CampoRuoloCucina({ defaultValue, idLista = "ruoli-cucina" }: { defaultValue?: string | null; idLista?: string }) {
  return (
    <>
      <Campo etichetta="Ruolo in cucina (facoltativo)" name="ruolo_cucina" list={idLista} defaultValue={defaultValue ?? ""} maxLength={40} autoComplete="off" />
      <datalist id={idLista}>
        {RUOLI_CUCINA.map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>
    </>
  );
}
