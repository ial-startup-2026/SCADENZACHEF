import * as React from "react";
import { cn } from "@/lib/utils";

// Campi alti almeno 48px e con testo da 16px (sotto i 16px iOS ingrandisce la pagina al tocco).
function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "min-h-12 w-full rounded-2xl border-[1.5px] border-input bg-card px-4 text-base text-foreground placeholder:text-muted-foreground disabled:opacity-50 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
