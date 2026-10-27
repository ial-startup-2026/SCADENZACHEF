import { APP_NAME } from "@/config/app";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-4 py-10">
      <p className="text-center text-2xl font-extrabold tracking-tight text-primary">{APP_NAME}</p>
      {children}
    </main>
  );
}
