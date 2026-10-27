import {
  AlarmClock,
  CircleCheck,
  Clock,
  OctagonX,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

/** I cinque stati del semaforo, dal meno al più urgente. */
export const STATI_SCADENZA = [
  "ok",
  "in-scadenza",
  "attenzione",
  "oggi",
  "scaduto",
] as const;

export type StatoScadenza = (typeof STATI_SCADENZA)[number];

type PresentazioneStato = {
  etichetta: string;
  icona: LucideIcon;
  /** Classi Tailwind: sfondo, testo e bordo (mai solo colore: c'è sempre icona + testo). */
  classi: string;
};

export const PRESENTAZIONE_STATO: Record<StatoScadenza, PresentazioneStato> = {
  ok: {
    etichetta: "OK",
    icona: CircleCheck,
    classi: "bg-stato-ok text-stato-ok-foreground border-stato-ok-border",
  },
  "in-scadenza": {
    etichetta: "In scadenza",
    icona: Clock,
    classi:
      "bg-stato-in-scadenza text-stato-in-scadenza-foreground border-stato-in-scadenza-border",
  },
  attenzione: {
    etichetta: "Attenzione",
    icona: TriangleAlert,
    classi:
      "bg-stato-attenzione text-stato-attenzione-foreground border-stato-attenzione-border",
  },
  oggi: {
    etichetta: "Scade oggi",
    icona: AlarmClock,
    classi: "bg-stato-oggi text-stato-oggi-foreground border-stato-oggi-border",
  },
  scaduto: {
    etichetta: "Scaduto",
    icona: OctagonX,
    classi:
      "bg-stato-scaduto text-stato-scaduto-foreground border-stato-scaduto-border",
  },
};
