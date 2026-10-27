import type { SupabaseClient } from "@supabase/supabase-js";

/** Link temporaneo (1 ora) alla foto di un profilo, che sta in un bucket privato. */
export async function urlFotoProfilo(supabase: SupabaseClient, percorso: string | null) {
  if (!percorso) return null;
  const { data } = await supabase.storage.from("avatar").createSignedUrl(percorso, 3600);
  return data?.signedUrl ?? null;
}

export function iniziali(nome: string): string {
  const parti = nome.trim().split(/\s+/).filter(Boolean);
  return ((parti[0]?.[0] ?? "?") + (parti.length > 1 ? (parti.at(-1)?.[0] ?? "") : "")).toUpperCase();
}
