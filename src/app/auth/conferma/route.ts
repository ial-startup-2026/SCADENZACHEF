import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { percorsoSicuro } from "@/lib/percorsi";
import { creaClientServer } from "@/lib/supabase/server";

/** Destinazione del link nell'email di conferma: apre la sessione e porta nell'app. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = percorsoSicuro(searchParams.get("next"));
  const codice = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;

  const supabase = await creaClientServer();
  let errore: unknown = new Error("link_incompleto");
  if (codice) {
    ({ error: errore } = await supabase.auth.exchangeCodeForSession(codice));
  } else if (tokenHash && tipo) {
    ({ error: errore } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash }));
  }

  return NextResponse.redirect(new URL(errore ? "/accedi?errore=conferma" : next, origin));
}
