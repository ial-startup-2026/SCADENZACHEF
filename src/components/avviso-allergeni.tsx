import { ShieldAlert } from "lucide-react";
import { AVVISO_ALLERGENI } from "@/lib/costanti/allergeni";

/** Avviso fisso: gli allergeni letti dall'etichetta non sostituiscono la verifica sull'etichetta originale. */
export function AvvisoAllergeni() {
  return (
    <p role="note" className="flex items-start gap-2 rounded-2xl bg-secondary p-3 text-base">
      <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
      <span>{AVVISO_ALLERGENI}</span>
    </p>
  );
}
