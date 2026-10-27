// Tipi delle righe lette dall'app. Sono scritti a mano e vanno tenuti allineati alle migrazioni;
// quando c'è un progetto Supabase collegato si possono sostituire con `supabase gen types`.
import type { Ruolo } from "@/lib/costanti/ruoli";

export type Profilo = {
  id: string;
  locale_id: string;
  nome: string;
  ruolo_cucina: string | null;
  ruolo: Ruolo;
  foto_url: string | null;
};

export type Locale = { id: string; nome: string };
