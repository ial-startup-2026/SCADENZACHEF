import { NextResponse, type NextRequest } from "next/server";
import { modalitaDemo } from "@/lib/demo/modalita";
import { eRotaPubblica } from "@/lib/percorsi";
import { supabaseConfigurato } from "@/lib/supabase/env";
import { aggiornaSessione, redirectConCookie } from "@/lib/supabase/sessione";

/**
 * Controllo "ottimistico": rinnova la sessione e manda al login chi non è collegato.
 * Non sostituisce i controlli veri, che stanno nella RLS del database e nelle Server Action.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Modalità demo (solo sviluppo): nessun login. Le pagine di accesso rimandano alla Home.
  if (modalitaDemo()) {
    if (pathname === "/accedi" || pathname === "/registrati" || pathname === "/benvenuto") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!supabaseConfigurato()) {
    if (pathname === "/configurazione") return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = "/configurazione";
    url.search = "";
    return NextResponse.rewrite(url);
  }

  const { response, autenticato } = await aggiornaSessione(request);

  if (!autenticato && !eRotaPubblica(pathname)) {
    const next = encodeURIComponent(pathname + search);
    return redirectConCookie(response, request, `/accedi?next=${next}`);
  }
  if (autenticato && (pathname === "/accedi" || pathname === "/registrati")) {
    return redirectConCookie(response, request, "/");
  }
  return response;
}

export const config = {
  // Esclude file statici, icone e il manifest.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|icon.png|apple-icon.png|sw.js|.*\\.(?:png|jpg|jpeg|svg|webp|ico|woff2?)$).*)",
  ],
};
