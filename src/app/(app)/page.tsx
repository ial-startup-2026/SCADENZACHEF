import { HomeContenuto } from "@/components/home-contenuto";
import { profiloCorrente } from "@/lib/auth";
import { caricaMagazzino } from "@/lib/dati";
import { contaPerStato } from "@/lib/scadenze/catalogo";

export default async function HomePage() {
  const adesso = new Date();
  const [dati, magazzino] = await Promise.all([profiloCorrente(), caricaMagazzino()]);

  const conteggi = magazzino.errore ? null : contaPerStato(magazzino.prodotti, adesso, magazzino.soglie);
  return <HomeContenuto adesso={adesso} nome={dati?.profilo.nome.split(" ")[0]} conteggi={conteggi} />;
}
