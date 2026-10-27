import type { Metadata } from "next";
import { RadiceDocumento, metadataBase, viewportBase } from "@/components/radice-documento";

// Vetrina statica per GitHub Pages: non va indicizzata dai motori di ricerca.
export const metadata: Metadata = { ...metadataBase, robots: { index: false, follow: false } };
export const viewport = viewportBase;

export default function RootLayoutVetrina({ children }: { children: React.ReactNode }) {
  return <RadiceDocumento>{children}</RadiceDocumento>;
}
