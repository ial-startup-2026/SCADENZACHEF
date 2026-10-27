import { TabBar } from "@/components/tab-bar";
import { richiediProfilo } from "@/lib/auth";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  // Chi non è collegato o non ha ancora un locale viene mandato ad accedere o a scegliere il locale.
  await richiediProfilo();
  return (
    <>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-32 pt-[max(1.5rem,env(safe-area-inset-top))]">
        {children}
      </main>
      <TabBar />
    </>
  );
}
