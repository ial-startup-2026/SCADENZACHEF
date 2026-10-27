import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_CHIAVE, SUPABASE_URL } from "./env";

/**
 * Rinnova la sessione Supabase (token in scadenza) e restituisce la risposta con i cookie
 * aggiornati. Da chiamare dal proxy a ogni richiesta.
 */
export async function aggiornaSessione(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_CHIAVE, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(daImpostare) {
        daImpostare.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        daImpostare.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getClaims() verifica la firma del token: non fidarsi mai di getSession() lato server.
  const { data } = await supabase.auth.getClaims();
  return { response, autenticato: Boolean(data?.claims?.sub) };
}

/** Redirect che conserva i cookie di sessione appena rinnovati. */
export function redirectConCookie(da: NextResponse, request: NextRequest, percorso: string) {
  const url = request.nextUrl.clone();
  const [pathname, query = ""] = percorso.split("?");
  url.pathname = pathname;
  url.search = query ? `?${query}` : "";
  const risposta = NextResponse.redirect(url);
  da.cookies.getAll().forEach((c) => risposta.cookies.set(c));
  return risposta;
}
