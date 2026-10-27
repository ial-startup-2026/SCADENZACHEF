"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ValoriModulo } from "@/lib/contesto-modulo";
import type { StatoAzione } from "@/lib/stato-azione";
import { cn } from "@/lib/utils";

export function BottoneInvio({
  children,
  variant,
  className,
}: {
  children: ReactNode;
  variant?: "default" | "outline" | "destructive" | "secondary";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" variant={variant} disabled={pending} aria-busy={pending} className={cn("w-full", className)}>
      {pending && <Loader2 className="animate-spin" aria-hidden />}
      {children}
    </Button>
  );
}

type Props = {
  azione: (stato: StatoAzione, dati: FormData) => Promise<StatoAzione>;
  invio: string;
  children: ReactNode;
  className?: string;
  variantInvio?: "default" | "outline" | "secondary";
};

/** Modulo collegato a una Server Action, con errori e conferme in evidenza. */
export function ModuloAzione({ azione, invio, children, className, variantInvio }: Props) {
  const [stato, esegui] = useActionState(azione, undefined);
  return (
    <form action={esegui} className={cn("space-y-4", className)}>
      <ValoriModulo value={stato?.valori}>{children}</ValoriModulo>
      {stato?.errore && (
        <p role="alert" className="rounded-xl border-2 border-destructive px-4 py-3 font-semibold text-destructive">
          {stato.errore}
        </p>
      )}
      {stato?.ok && (
        <p role="status" className="rounded-xl border-2 border-primary px-4 py-3 font-semibold text-primary">
          {stato.ok}
        </p>
      )}
      <BottoneInvio variant={variantInvio}>{invio}</BottoneInvio>
    </form>
  );
}
