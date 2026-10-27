import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_CHIAVE, SUPABASE_URL } from "./env";

/** Client per Server Component, Server Action e Route Handler. */
export async function creaClientServer() {
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_CHIAVE, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(daImpostare) {
        try {
          daImpostare.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Chiamato da un Server Component: i cookie non si possono scrivere qui.
          // Va bene, perché il proxy aggiorna già la sessione a ogni richiesta.
        }
      },
    },
  });
}
