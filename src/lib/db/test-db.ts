// Banco di prova per le migrazioni: Postgres in memoria (PGlite) con uno stub minimo dello
// schema `auth` di Supabase. Serve solo ai test; non è codice dell'app.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

const DIR_SUPABASE = join(process.cwd(), "supabase");

const STUB_SUPABASE = `
  create extension pgcrypto;
  create schema auth;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    instance_id uuid, aud text, role text, email text, encrypted_password text,
    email_confirmed_at timestamptz, raw_app_meta_data jsonb, raw_user_meta_data jsonb,
    created_at timestamptz, updated_at timestamptz,
    confirmation_token text, recovery_token text, email_change text, email_change_token_new text
  );
  create table auth.identities (
    id uuid primary key, user_id uuid references auth.users (id) on delete cascade,
    provider_id text, identity_data jsonb, provider text,
    last_sign_in_at timestamptz, created_at timestamptz, updated_at timestamptz
  );
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  grant usage on schema public to anon, authenticated;
`;

export function leggiMigrazioni(): { nome: string; sql: string }[] {
  const dir = join(DIR_SUPABASE, "migrations");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((nome) => ({ nome, sql: readFileSync(join(dir, nome), "utf8") }));
}

export const leggiSeed = () => readFileSync(join(DIR_SUPABASE, "seed.sql"), "utf8");

export async function creaDb(): Promise<PGlite> {
  const db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(STUB_SUPABASE);
  for (const { nome, sql } of leggiMigrazioni()) {
    // La migrazione dello Storage usa lo schema `storage`, che esiste solo su Supabase.
    if (nome.includes("storage")) continue;
    await db.exec(sql);
  }
  return db;
}

export async function creaUtente(db: PGlite, id: string, email: string) {
  await db.query("insert into auth.users (id, email) values ($1, $2)", [id, email]);
}

/** Esegue `fn` come utente autenticato (RLS attiva), poi torna al ruolo di servizio del test. */
export async function come<T>(db: PGlite, uid: string, fn: () => Promise<T>): Promise<T> {
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [uid]);
  await db.exec("set role authenticated");
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
  }
}

/** Esegue `fn` come visitatore non autenticato. */
export async function comeAnonimo<T>(db: PGlite, fn: () => Promise<T>): Promise<T> {
  await db.exec("set role anon");
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
  }
}

/** Messaggio dell'errore Postgres, o null se la query riesce. */
export async function errore(fn: () => Promise<unknown>): Promise<string | null> {
  try {
    await fn();
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}
