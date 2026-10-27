import type { Metadata } from "next";
import { ScansionaVetrina } from "@/components/vetrina/scansiona-vetrina";

export const metadata: Metadata = { title: "Scansiona" };

export default function PaginaScansiona() {
  return <ScansionaVetrina />;
}
