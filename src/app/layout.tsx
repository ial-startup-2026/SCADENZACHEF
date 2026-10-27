import type { Metadata } from "next";
import { RadiceDocumento, metadataBase, viewportBase } from "@/components/radice-documento";

export const metadata: Metadata = metadataBase;
export const viewport = viewportBase;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <RadiceDocumento>{children}</RadiceDocumento>;
}
