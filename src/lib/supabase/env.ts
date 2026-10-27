// Le variabili NEXT_PUBLIC_* vanno scritte per intero: Next le sostituisce al momento della build.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_CHIAVE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export function supabaseConfigurato(): boolean {
  return SUPABASE_URL.startsWith("http") && SUPABASE_CHIAVE.length > 0;
}
