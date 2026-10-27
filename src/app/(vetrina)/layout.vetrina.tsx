import { BarraSuperiore } from "@/components/barra-superiore";
import { TabBar } from "@/components/tab-bar";

export default function LayoutVetrina({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-36 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <p role="note" className="mb-3 rounded-2xl bg-accent px-4 py-3 text-base text-accent-foreground">
          <strong className="font-semibold">Versione dimostrativa.</strong> Dati di prova, senza account: le modifiche non vengono salvate.
        </p>
        <BarraSuperiore nome="Marta Rossi" />
        {children}
      </main>
      <TabBar />
    </>
  );
}
