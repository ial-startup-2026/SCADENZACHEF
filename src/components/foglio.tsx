"use client";

import type { ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";

type Props = {
  aperto: boolean;
  onChiudi: () => void;
  titolo: string;
  descrizione?: string;
  children: ReactNode;
};

/** Foglio che sale dal basso (zona del pollice). Si chiude con la X, toccando fuori o con Esc. */
export function Foglio({ aperto, onChiudi, titolo, descrizione, children }: Props) {
  return (
    <Dialog.Root open={aperto} onOpenChange={(open) => !open && onChiudi()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[92dvh] w-full max-w-xl overflow-y-auto overscroll-contain rounded-t-3xl bg-card p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-card-foreground shadow-2xl outline-none transition-transform duration-300 ease-out data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full">
          <span aria-hidden className="mx-auto mb-4 block h-1.5 w-12 rounded-full bg-border" />
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Dialog.Title className="text-2xl font-extrabold leading-tight">{titolo}</Dialog.Title>
              {descrizione && (
                <Dialog.Description className="mt-1 text-base text-muted-foreground">{descrizione}</Dialog.Description>
              )}
            </div>
            <Dialog.Close
              aria-label="Chiudi"
              className="-mr-2 -mt-1 flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-muted"
            >
              <X className="size-6" aria-hidden />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
