import { BarraSuperiore } from "@/components/barra-superiore";
import { TabBar } from "@/components/tab-bar";
import { richiediProfilo } from "@/lib/auth";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  // Chi non è collegato o non ha ancora un locale viene mandato ad accedere o a scegliere il locale.
  const { profilo } = await richiediProfilo();
  return (
    <>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-36 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <BarraSuperiore nome={profilo.nome} />
        {children}
      </main>
      <TabBar />
    </>
  );
}
