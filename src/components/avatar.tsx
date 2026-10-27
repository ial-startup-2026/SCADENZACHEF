import { iniziali } from "@/lib/foto-profilo";
import { cn } from "@/lib/utils";

type Props = { nome: string; url?: string | null; className?: string };

/** Foto del profilo, o le iniziali se manca. */
export function Avatar({ nome, url, className }: Props) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element -- link firmato di Storage: non serve l'ottimizzazione di next/image
    <img src={url} alt="" className={cn("size-16 shrink-0 rounded-full object-cover", className)} />
  ) : (
    <span
      aria-hidden
      className={cn("flex size-16 shrink-0 items-center justify-center rounded-full bg-accent text-xl font-semibold text-accent-foreground", className)}
    >
      {iniziali(nome)}
    </span>
  );
}
