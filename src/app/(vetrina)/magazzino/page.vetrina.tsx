import type { Metadata } from "next";
import { Suspense } from "react";
import { MagazzinoVetrina } from "@/components/vetrina/magazzino-vetrina";

export const metadata: Metadata = { title: "Magazzino" };

export default function PaginaMagazzino() {
  // useSearchParams (il filtro dall'indirizzo) richiede un Suspense nell'esportazione statica.
  return (
    <Suspense fallback={null}>
      <MagazzinoVetrina />
    </Suspense>
  );
}
