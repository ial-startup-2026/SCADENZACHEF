import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_CHIAVE, SUPABASE_URL } from "./env";

/** Client per i componenti del browser (usa la sessione nei cookie). */
export function creaClientBrowser() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_CHIAVE);
}
