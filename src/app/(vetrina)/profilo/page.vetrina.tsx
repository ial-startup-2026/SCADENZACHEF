import type { Metadata } from "next";
import { ProfiloVetrina } from "@/components/vetrina/profilo-vetrina";

export const metadata: Metadata = { title: "Profilo" };

export default function PaginaProfilo() {
  return <ProfiloVetrina />;
}
