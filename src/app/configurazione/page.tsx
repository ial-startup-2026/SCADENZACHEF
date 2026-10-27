import { APP_NAME } from "@/config/app";

export default function ConfigurazionePage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">{APP_NAME} non è ancora collegata</h1>
      <p>Manca il collegamento a Supabase. Per attivarlo:</p>
      <ol className="list-decimal space-y-2 pl-6">
        <li>
          Copia <code className="rounded bg-muted px-1.5 py-0.5">.env.example</code> in{" "}
          <code className="rounded bg-muted px-1.5 py-0.5">.env.local</code>.
        </li>
        <li>
          Compila <code className="rounded bg-muted px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
          <code className="rounded bg-muted px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> con i valori di Supabase
          (Project settings → API).
        </li>
        <li>Riavvia il server di sviluppo.</li>
      </ol>
    </main>
  );
}
