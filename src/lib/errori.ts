/** Messaggi dell'app per gli errori delle funzioni del database (vedi supabase/migrations). */
const MESSAGGI: Record<string, string> = {
  non_autenticato: "Devi accedere per continuare.",
  non_autorizzato: "Non hai i permessi per farlo.",
  profilo_esistente: "Fai già parte di un locale.",
  codice_non_valido: "Codice non valido. Controlla con il titolare e riprova.",
  nome_mancante: "Scrivi il tuo nome.",
  nome_locale_mancante: "Scrivi il nome del locale.",
  ultimo_admin: "Deve restare almeno un Admin nel locale.",
  utente_non_trovato: "Questa persona non fa più parte del locale.",
  ruolo_non_valido: "Ruolo non valido.",
  nessun_locale: "Non fai ancora parte di un locale.",
  quantita_non_valida: "La quantità non è valida.",
  prodotto_non_trovato: "Prodotto non trovato.",
  prodotto_non_attivo: "Questo prodotto è già stato scaricato.",
  motivo_mancante: "Indica il motivo.",
  movimento_non_trovato: "Movimento non trovato.",
  non_annullabile: "Questo movimento non si può annullare.",
};

const GENERICO = "Qualcosa è andato storto. Riprova tra poco.";

/** Traduce un errore del database (o di Auth) in un messaggio per chi usa l'app. */
export function messaggioErrore(errore: { message?: string } | null | undefined): string {
  const testo = errore?.message ?? "";
  for (const [codice, messaggio] of Object.entries(MESSAGGI)) {
    if (testo.includes(codice)) return messaggio;
  }
  return GENERICO;
}

/** Errori di Auth (Supabase) più comuni, in italiano. */
export function messaggioErroreAuth(errore: { message?: string; code?: string } | null | undefined): string {
  const codice = errore?.code ?? "";
  const testo = (errore?.message ?? "").toLowerCase();
  if (codice === "invalid_credentials" || testo.includes("invalid login")) {
    return "Email o password non corrette.";
  }
  if (codice === "email_not_confirmed") return "Conferma prima la tua email: ti abbiamo scritto.";
  if (codice === "user_already_exists" || testo.includes("already registered")) {
    return "Esiste già un account con questa email. Prova ad accedere.";
  }
  if (codice === "weak_password") return "Password troppo debole: usa almeno 8 caratteri.";
  if (codice === "over_request_rate_limit" || codice === "over_email_send_rate_limit") {
    return "Troppi tentativi. Aspetta un minuto e riprova.";
  }
  return GENERICO;
}
