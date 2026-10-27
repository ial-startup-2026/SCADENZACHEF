import type { Metadata } from "next";
import { ScansionaApp } from "@/components/scansione/scansiona-app";
import { richiediProfilo } from "@/lib/auth";
import { modalitaDemo } from "@/lib/demo/modalita";

export const metadata: Metadata = { title: "Scansiona" };

export default async function ScansionaPage() {
  const { profilo } = await richiediProfilo();
  return <ScansionaApp localeId={profilo.locale_id} demo={modalitaDemo()} />;
}
