import { TabBar } from "@/components/tab-bar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-32 pt-[max(1.5rem,env(safe-area-inset-top))]">
        {children}
      </main>
      <TabBar />
    </>
  );
}
