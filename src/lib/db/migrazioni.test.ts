import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CODICI_ALLERGENI } from "@/lib/costanti/allergeni";
import { CATEGORIE } from "@/lib/costanti/categorie";
import { MOTIVI_SPRECO } from "@/lib/costanti/motivi-spreco";
import { POSIZIONI } from "@/lib/costanti/posizioni";
import { UNITA } from "@/lib/costanti/unita";
import { come, comeAnonimo, creaDb, creaUtente, errore, leggiSeed } from "./test-db";

const A = "a0000000-0000-4000-8000-000000000001"; // admin del locale 1
const B = "b0000000-0000-4000-8000-000000000002"; // staff del locale 1
const C = "c0000000-0000-4000-8000-000000000003"; // admin del locale 2
const D = "d0000000-0000-4000-8000-000000000004"; // senza locale

let db: PGlite;
let locale1: string;
let locale2: string;
let codice1: string;

const q = <T = Record<string, unknown>>(sql: string, params: unknown[] = []) =>
  db.query<T>(sql, params).then((r) => r.rows);

const uuid = () => crypto.randomUUID();

async function nuovoProdotto(uid: string, over: Partial<Record<string, unknown>> = {}) {
  const p = {
    nome: "Burrata", categoria: "latticini", posizione: "cella_frigo", quantita: 6,
    unita: "pz", scadenza: "2026-12-01", lotto: null, allergeni: ["latte"], foto: null, ...over,
  };
  const [r] = await come(db, uid, () =>
    q<{ id: string }>(
      "select public.registra_prodotto($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) as id",
      [uuid(), p.nome, p.categoria, p.posizione, p.quantita, p.unita, p.scadenza, p.lotto, p.allergeni, p.foto],
    ),
  );
  return r.id;
}

beforeAll(async () => {
  db = await creaDb();
  await creaUtente(db, A, "a@test.test");
  await creaUtente(db, B, "b@test.test");
  await creaUtente(db, C, "c@test.test");
  await creaUtente(db, D, "d@test.test");

  [{ crea_locale: locale1 }] = (await come(db, A, () =>
    q<{ crea_locale: string }>("select public.crea_locale('Locale uno', ' Anna ', 'Chef')"),
  )) as [{ crea_locale: string }];
  [{ crea_locale: locale2 }] = (await come(db, C, () =>
    q<{ crea_locale: string }>("select public.crea_locale('Locale due', 'Carlo')"),
  )) as [{ crea_locale: string }];
  [{ leggi_codice_invito: codice1 }] = (await come(db, A, () =>
    q<{ leggi_codice_invito: string }>("select public.leggi_codice_invito()"),
  )) as [{ leggi_codice_invito: string }];
  await come(db, B, () =>
    q("select public.unisciti_al_locale($1, 'Bruno', null)", [` ${codice1.toLowerCase()} `]),
  );
});

afterAll(async () => {
  await db.close();
});

describe("coerenza con le costanti dell'app", () => {
  const COLONNE: [string, string, readonly string[]][] = [
    ["prodotti_magazzino", "allergeni", CODICI_ALLERGENI],
    ["prodotti_magazzino", "posizione", POSIZIONI.map((p) => p.codice)],
    ["prodotti_magazzino", "categoria", CATEGORIE.map((c) => c.codice)],
    ["prodotti_magazzino", "unita", UNITA.map((u) => u.codice)],
    ["movimenti", "motivo", MOTIVI_SPRECO.map((m) => m.codice)],
    ["movimenti", "unita", []],
    ["lista_spesa", "unita", UNITA.map((u) => u.codice)],
  ];

  it.each(COLONNE.filter(([, , valori]) => valori.length > 0))(
    "%s.%s ha gli stessi valori di src/lib/costanti",
    async (tabella, colonna, valori) => {
      const righe = await q<{ def: string }>(
        `select pg_get_constraintdef(oid) as def from pg_constraint
         where conrelid = $1::regclass and contype = 'c'`,
        [`public.${tabella}`],
      );
      const def = righe.map((r) => r.def).find((d) => d.startsWith(`CHECK ((${colonna} `) || d.startsWith(`CHECK (((${colonna} `) || d.includes(`(${colonna} = ANY`) || d.includes(`(${colonna} <@`));
      expect(def, `nessun CHECK trovato per ${tabella}.${colonna}`).toBeDefined();
      const nelDb = [...def!.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
      expect([...new Set(nelDb)].sort()).toEqual([...valori].sort());
    },
  );
});

describe("ingresso nel locale", () => {
  it("chi crea il locale è Admin e ha le impostazioni di default", async () => {
    const [p] = await come(db, A, () => q<{ ruolo: string; nome: string }>("select ruolo, nome from profili where id = $1", [A]));
    expect(p).toEqual({ ruolo: "admin", nome: "Anna" });
    const [imp] = await come(db, A, () => q<{ soglia_giallo: number; soglia_arancione: number }>("select * from impostazioni_locale"));
    expect(imp.soglia_giallo).toBe(7);
    expect(imp.soglia_arancione).toBe(3);
  });

  it("il codice d'invito ha 6 caratteri leggibili", () => {
    expect(codice1).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
  });

  it("entrare con il codice (anche in minuscolo e con spazi) crea un profilo Staff", async () => {
    const [p] = await come(db, B, () => q<{ ruolo: string; locale_id: string }>("select ruolo, locale_id from profili where id = $1", [B]));
    expect(p).toEqual({ ruolo: "staff", locale_id: locale1 });
  });

  it("un codice sbagliato è rifiutato", async () => {
    const e = await come(db, D, () => errore(() => q("select public.unisciti_al_locale('ZZZZZZ', 'Dario')")));
    expect(e).toContain("codice_non_valido");
  });

  it("non si può entrare due volte", async () => {
    expect(await come(db, B, () => errore(() => q("select public.unisciti_al_locale($1, 'Bis')", [codice1])))).toContain("profilo_esistente");
    expect(await come(db, A, () => errore(() => q("select public.crea_locale('Altro', 'Anna')")))).toContain("profilo_esistente");
  });

  it("senza login non si può fare nulla", async () => {
    expect(await errore(() => comeAnonimo(db, () => q("select * from prodotti_magazzino")))).toContain("permission denied");
    expect(await errore(() => comeAnonimo(db, () => q("select public.crea_locale('X', 'Y')")))).toContain("permission denied");
  });
});

describe("isolamento tra locali e privilegi", () => {
  it("ognuno vede solo il proprio locale e i propri colleghi", async () => {
    const visti = await come(db, A, () => q<{ id: string }>("select id from profili order by id"));
    expect(visti.map((r) => r.id)).toEqual([A, B]);
    const locali = await come(db, C, () => q<{ id: string }>("select id from locali"));
    expect(locali.map((r) => r.id)).toEqual([locale2]);
  });

  it("chi non ha un locale non vede nulla", async () => {
    expect(await come(db, D, () => q("select * from profili"))).toHaveLength(0);
    expect(await come(db, D, () => q("select id, nome from locali"))).toHaveLength(0);
  });

  it("il codice d'invito non è leggibile con una select", async () => {
    const e = await come(db, A, () => errore(() => q("select codice_invito from locali")));
    expect(e).toContain("permission denied");
  });

  it("non si può promuovere se stessi né cambiare locale", async () => {
    expect(await come(db, B, () => errore(() => q("update profili set ruolo = 'admin' where id = $1", [B])))).toContain("permission denied");
    expect(await come(db, B, () => errore(() => q("update profili set locale_id = $1 where id = $2", [locale2, B])))).toContain("permission denied");
  });

  it("si può modificare solo il proprio profilo", async () => {
    await come(db, B, () => q("update profili set ruolo_cucina = 'Cuoco' where id = $1", [B]));
    const r = await come(db, B, () => db.query("update profili set nome = 'Hack' where id = $1", [A]));
    expect(r.affectedRows).toBe(0);
  });

  it("solo l'Admin rinomina il locale", async () => {
    expect((await come(db, B, () => db.query("update locali set nome = 'X' where id = $1", [locale1]))).affectedRows).toBe(0);
    expect((await come(db, A, () => db.query("update locali set nome = 'Locale uno' where id = $1", [locale1]))).affectedRows).toBe(1);
  });

  it("solo l'Admin cambia le soglie, e devono essere coerenti", async () => {
    expect((await come(db, B, () => db.query("update impostazioni_locale set soglia_giallo = 10"))).affectedRows).toBe(0);
    expect((await come(db, A, () => db.query("update impostazioni_locale set soglia_giallo = 10"))).affectedRows).toBe(1);
    expect(await come(db, A, () => errore(() => q("update impostazioni_locale set soglia_giallo = 2")))).toContain("violates check constraint");
    await come(db, A, () => q("update impostazioni_locale set soglia_giallo = 7"));
  });

  it("non si scrive direttamente su prodotti e movimenti (solo tramite funzioni)", async () => {
    const ins = `insert into prodotti_magazzino (locale_id, nome, posizione, quantita, data_scadenza) values ($1, 'X', 'banco', 1, '2026-12-01')`;
    expect(await come(db, A, () => errore(() => q(ins, [locale1])))).toContain("permission denied");
    expect(await come(db, A, () => errore(() => q("insert into movimenti (locale_id, nome_prodotto, categoria, unita, tipo, quantita) values ($1,'x','altro','pz','carico',1)", [locale1])))).toContain("permission denied");
    expect(await come(db, A, () => errore(() => q("delete from movimenti")))).toContain("permission denied");
    expect(await come(db, A, () => errore(() => q("update movimenti set quantita = 99")))).toContain("permission denied");
  });
});

describe("magazzino", () => {
  let prodotto: string;

  it("registra_prodotto crea il prodotto e il carico, ed è idempotente", async () => {
    const cid = uuid();
    const args = [cid, "Mozzarella", "latticini", "cella_frigo", 4, "pz", "2026-12-01", " L1 ", ["latte"], null];
    const sql = "select public.registra_prodotto($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) as id";
    const [{ id }] = await come(db, B, () => q<{ id: string }>(sql, args));
    const [{ id: id2 }] = await come(db, B, () => q<{ id: string }>(sql, args));
    expect(id2).toBe(id);
    prodotto = id;

    const [p] = await come(db, A, () => q<{ lotto: string; creato_da: string; stato: string }>("select lotto, creato_da, stato from prodotti_magazzino where id = $1", [id]));
    expect(p).toEqual({ lotto: "L1", creato_da: B, stato: "attivo" });
    const mov = await come(db, A, () => q<{ tipo: string; utente_id: string }>("select tipo, utente_id from movimenti where prodotto_id = $1", [id]));
    expect(mov).toEqual([{ tipo: "carico", utente_id: B }]);
  });

  it("rifiuta dati non validi", async () => {
    const sql = "select public.registra_prodotto($1,'X','altro','banco',$2,'pz','2026-12-01',null,$3,$4)";
    expect(await come(db, A, () => errore(() => q(sql, [uuid(), 0, [], null])))).toContain("quantita_non_valida");
    expect(await come(db, A, () => errore(() => q(sql, [uuid(), 1, ["cioccolato"], null])))).toContain("violates check constraint");
    expect(await come(db, A, () => errore(() => q(sql, [uuid(), 1, [], `${locale2}/x.jpg`])))).toContain("foto_non_valida");
    expect(await come(db, D, () => errore(() => q(sql, [uuid(), 1, [], null])))).toContain("nessun_locale");
  });

  it("l'altro locale non vede né modifica il prodotto", async () => {
    expect(await come(db, C, () => q("select * from prodotti_magazzino where id = $1", [prodotto]))).toHaveLength(0);
    expect((await come(db, C, () => db.query("update prodotti_magazzino set nome = 'Hack' where id = $1", [prodotto]))).affectedRows).toBe(0);
    expect(await come(db, C, () => errore(() => q("select public.scarica_prodotto(null, $1, 'scarico')", [prodotto])))).toContain("prodotto_non_trovato");
  });

  it("si possono modificare i dati descrittivi ma non quantità e stato", async () => {
    await come(db, B, () => q("update prodotti_magazzino set posizione = 'banco', data_scadenza = '2026-12-05' where id = $1", [prodotto]));
    expect(await come(db, B, () => errore(() => q("update prodotti_magazzino set quantita = 100 where id = $1", [prodotto])))).toContain("permission denied");
    expect(await come(db, B, () => errore(() => q("update prodotti_magazzino set stato = 'finito' where id = $1", [prodotto])))).toContain("permission denied");
  });

  it("scarico parziale e totale (→ finito), con registro dei movimenti", async () => {
    const id = await nuovoProdotto(A, { quantita: 5 });
    const [parz] = await come(db, B, () => q<{ r: { quantita: number; stato: string } }>("select public.scarica_prodotto($1, $2, 'scarico', 2) as r", [uuid(), id]));
    expect(parz.r).toMatchObject({ quantita: 3, stato: "attivo" });
    const [tot] = await come(db, B, () => q<{ r: { quantita: number; stato: string } }>("select public.scarica_prodotto($1, $2, 'scarico') as r", [uuid(), id]));
    expect(tot.r).toMatchObject({ quantita: 0, stato: "finito" });
    const mov = await come(db, A, () => q<{ tipo: string; quantita: string }>("select tipo, quantita from movimenti where prodotto_id = $1 order by creato_il, tipo", [id]));
    expect(mov.map((m) => `${m.tipo}:${Number(m.quantita)}`).sort()).toEqual(["carico:5", "scarico:2", "scarico:3"]);
    expect(await come(db, A, () => errore(() => q("select public.scarica_prodotto(null, $1, 'scarico')", [id])))).toContain("prodotto_non_attivo");
  });

  it("lo spreco richiede il motivo e porta il prodotto a 'buttato'", async () => {
    const id = await nuovoProdotto(A, { quantita: 2 });
    expect(await come(db, A, () => errore(() => q("select public.scarica_prodotto(null, $1, 'spreco')", [id])))).toContain("motivo_mancante");
    const [r] = await come(db, A, () => q<{ r: { stato: string } }>("select public.scarica_prodotto(null, $1, 'spreco', null, 'scaduto') as r", [id]));
    expect(r.r.stato).toBe("buttato");
    const [m] = await come(db, A, () => q<{ motivo: string; nome_prodotto: string; categoria: string }>("select motivo, nome_prodotto, categoria from movimenti where prodotto_id = $1 and tipo = 'spreco'", [id]));
    expect(m).toEqual({ motivo: "scaduto", nome_prodotto: "Burrata", categoria: "latticini" });
  });

  it("rifiuta quantità eccessive o nulle", async () => {
    const id = await nuovoProdotto(A, { quantita: 2 });
    expect(await come(db, A, () => errore(() => q("select public.scarica_prodotto(null, $1, 'scarico', 3)", [id])))).toContain("quantita_non_valida");
    expect(await come(db, A, () => errore(() => q("select public.scarica_prodotto(null, $1, 'scarico', 0)", [id])))).toContain("quantita_non_valida");
  });

  it("rinviare lo stesso scarico (coda offline) non lo duplica", async () => {
    const id = await nuovoProdotto(A, { quantita: 10 });
    const cid = uuid();
    const sql = "select public.scarica_prodotto($1, $2, 'scarico', 4) as r";
    await come(db, A, () => q(sql, [cid, id]));
    const [again] = await come(db, A, () => q<{ r: { ripetuto: boolean; quantita: number } }>(sql, [cid, id]));
    expect(again.r).toMatchObject({ ripetuto: true, quantita: 6 });
  });

  it("annulla_movimento ripristina la quantità; solo autore o Admin; idempotente", async () => {
    const id = await nuovoProdotto(A, { quantita: 3 });
    const [{ r }] = await come(db, B, () => q<{ r: { movimento_id: string } }>("select public.scarica_prodotto(null, $1, 'scarico') as r", [id]));
    const mov = r.movimento_id;

    // un altro Staff non può annullare; l'autore sì
    await creaUtente(db, "e0000000-0000-4000-8000-000000000005", "e@test.test");
    await come(db, "e0000000-0000-4000-8000-000000000005", () => q("select public.unisciti_al_locale($1, 'Elena')", [codice1]));
    expect(await come(db, "e0000000-0000-4000-8000-000000000005", () => errore(() => q("select public.annulla_movimento($1)", [mov])))).toContain("non_autorizzato");

    const [ok] = await come(db, B, () => q<{ r: { quantita: number; stato: string } }>("select public.annulla_movimento($1) as r", [mov]));
    expect(ok.r).toMatchObject({ quantita: 3, stato: "attivo" });
    const [again] = await come(db, B, () => q<{ r: { ripetuto: boolean } }>("select public.annulla_movimento($1) as r", [mov]));
    expect(again.r.ripetuto).toBe(true);
    const [riga] = await come(db, A, () => q<{ annullato_da: string }>("select annullato_da from movimenti where id = $1", [mov]));
    expect(riga.annullato_da).toBe(B);

    // il carico non si annulla; l'Admin può annullare lo scarico di un altro
    const [car] = await q<{ id: string }>("select id from movimenti where prodotto_id = $1 and tipo = 'carico'", [id]);
    expect(await come(db, A, () => errore(() => q("select public.annulla_movimento($1)", [car.id])))).toContain("non_annullabile");
    const [{ r: r2 }] = await come(db, B, () => q<{ r: { movimento_id: string } }>("select public.scarica_prodotto(null, $1, 'spreco', 1, 'rovinato') as r", [id]));
    await come(db, A, () => q("select public.annulla_movimento($1)", [r2.movimento_id]));
  });
});

describe("team", () => {
  it("solo l'Admin vede e rigenera il codice d'invito", async () => {
    expect(await come(db, B, () => errore(() => q("select public.leggi_codice_invito()")))).toContain("non_autorizzato");
    expect(await come(db, B, () => errore(() => q("select public.rigenera_codice_invito()")))).toContain("non_autorizzato");
    const [{ rigenera_codice_invito: nuovo }] = await come(db, A, () => q<{ rigenera_codice_invito: string }>("select public.rigenera_codice_invito()"));
    expect(nuovo).not.toBe(codice1);
    expect(await come(db, D, () => errore(() => q("select public.unisciti_al_locale($1, 'Dario')", [codice1])))).toContain("codice_non_valido");
    codice1 = nuovo;
  });

  it("gestione ruoli: solo Admin, mai senza Admin", async () => {
    expect(await come(db, B, () => errore(() => q("select public.imposta_ruolo($1, 'admin')", [B])))).toContain("non_autorizzato");
    expect(await come(db, A, () => errore(() => q("select public.imposta_ruolo($1, 'staff')", [A])))).toContain("ultimo_admin");
    expect(await come(db, A, () => errore(() => q("select public.imposta_ruolo($1, 'staff')", [C])))).toContain("utente_non_trovato");
    expect(await come(db, A, () => errore(() => q("select public.imposta_ruolo($1, 'capo')", [B])))).toContain("ruolo_non_valido");

    await come(db, A, () => q("select public.imposta_ruolo($1, 'admin')", [B]));
    await come(db, B, () => q("select public.imposta_ruolo($1, 'staff')", [A]));
    // ora l'unico Admin è B: va ripristinato A per i test successivi
    await come(db, B, () => q("select public.imposta_ruolo($1, 'admin')", [A]));
    await come(db, A, () => q("select public.imposta_ruolo($1, 'staff')", [B]));
  });

  it("rimuovi_membro: non l'ultimo Admin, solo nel proprio locale", async () => {
    expect(await come(db, A, () => errore(() => q("select public.rimuovi_membro($1)", [A])))).toContain("ultimo_admin");
    expect(await come(db, A, () => errore(() => q("select public.rimuovi_membro($1)", [C])))).toContain("utente_non_trovato");
    expect(await come(db, B, () => errore(() => q("select public.rimuovi_membro($1)", [A])))).toContain("non_autorizzato");
    await come(db, A, () => q("select public.rimuovi_membro($1)", ["e0000000-0000-4000-8000-000000000005"]));
    expect(await q("select 1 from profili where id = 'e0000000-0000-4000-8000-000000000005'")).toHaveLength(0);
  });
});

describe("lista della spesa", () => {
  it("l'autore è sempre l'utente collegato e non si può falsificare", async () => {
    const sql = "insert into lista_spesa (locale_id, nome, quantita, unita, urgenza) values ($1, 'Limoni', 10, 'pz', 'urgente') returning id, richiesto_da, aggiornato_da, stato";
    const [r] = await come(db, B, () => q<{ richiesto_da: string; aggiornato_da: string; stato: string }>(sql, [locale1]));
    expect(r).toMatchObject({ richiesto_da: B, aggiornato_da: B, stato: "da_comprare" });
    expect(await come(db, B, () => errore(() => q("insert into lista_spesa (locale_id, nome, richiesto_da) values ($1, 'X', $2)", [locale1, A])))).toContain("permission denied");
    expect(await come(db, B, () => errore(() => q("insert into lista_spesa (locale_id, nome) values ($1, 'X')", [locale2])))).toContain("row-level security");
  });

  it("chi cambia lo stato viene registrato; elimina solo l'autore o l'Admin", async () => {
    const [{ id }] = await come(db, B, () => q<{ id: string }>("insert into lista_spesa (locale_id, nome) values ($1, 'Burro') returning id", [locale1]));
    await come(db, A, () => q("update lista_spesa set stato = 'ordinato' where id = $1", [id]));
    const [r] = await come(db, B, () => q<{ aggiornato_da: string; richiesto_da: string; stato: string }>("select aggiornato_da, richiesto_da, stato from lista_spesa where id = $1", [id]));
    expect(r).toEqual({ aggiornato_da: A, richiesto_da: B, stato: "ordinato" });
    expect((await come(db, C, () => db.query("delete from lista_spesa where id = $1", [id]))).affectedRows).toBe(0);
    expect((await come(db, A, () => db.query("delete from lista_spesa where id = $1", [id]))).affectedRows).toBe(1);
  });
});

describe("notifiche push", () => {
  it("ognuno gestisce solo le proprie sottoscrizioni", async () => {
    await come(db, B, () => q("insert into push_subscriptions (utente_id, locale_id, endpoint, p256dh, auth) values ($1, $2, 'https://push.test/b', 'k', 'a')", [B, locale1]));
    expect(await come(db, A, () => q("select * from push_subscriptions"))).toHaveLength(0);
    expect(await come(db, A, () => errore(() => q("insert into push_subscriptions (utente_id, locale_id, endpoint, p256dh, auth) values ($1, $2, 'https://push.test/x', 'k', 'a')", [B, locale1])))).toContain("row-level security");
    expect(await come(db, B, () => q("select * from push_subscriptions"))).toHaveLength(1);
  });

  it("notifiche_inviate non è accessibile ai client", async () => {
    expect(await come(db, A, () => errore(() => q("select * from notifiche_inviate")))).toContain("permission denied");
  });
});

describe("seed", () => {
  it("riempie il locale demo con prodotti in tutti gli stati del semaforo", async () => {
    await db.exec(leggiSeed());
    const chef = "11111111-1111-4111-8111-111111111111";
    const righe = await come(db, chef, () =>
      q<{ giorni: number }>(
        `select (data_scadenza - (now() at time zone 'Europe/Rome')::date)::int as giorni
         from prodotti_magazzino where stato = 'attivo'`,
      ),
    );
    const g = righe.map((r) => r.giorni);
    expect(g.filter((x) => x < 0).length).toBeGreaterThanOrEqual(1); // Scaduto
    expect(g.filter((x) => x === 0).length).toBeGreaterThanOrEqual(1); // Scade oggi
    expect(g.filter((x) => x >= 1 && x <= 3).length).toBeGreaterThanOrEqual(1); // Attenzione
    expect(g.filter((x) => x >= 4 && x <= 7).length).toBeGreaterThanOrEqual(1); // In scadenza
    expect(g.filter((x) => x > 7).length).toBeGreaterThanOrEqual(1); // OK
    expect(g.length).toBeGreaterThanOrEqual(20);

    const sprechi = await come(db, chef, () => q("select 1 from movimenti where tipo = 'spreco'"));
    expect(sprechi.length).toBeGreaterThanOrEqual(10);
  });

  it("è rieseguibile e il demo resta isolato dagli altri locali", async () => {
    await db.exec(leggiSeed());
    const [{ n }] = await q<{ n: number }>("select count(*)::int as n from locali where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'");
    expect(n).toBe(1);
    expect(await come(db, C, () => q("select * from prodotti_magazzino where locale_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'"))).toHaveLength(0);
    const staff = "22222222-2222-4222-8222-222222222222";
    const [p] = await come(db, staff, () => q<{ ruolo: string }>("select ruolo from profili where id = $1", [staff]));
    expect(p.ruolo).toBe("staff");
  });
});
