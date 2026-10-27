// Unisce le migrazioni in un solo file da incollare nello SQL Editor di Supabase.
// Uso: npm run db:sql   →   supabase/.generato/setup.sql
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const dir = "supabase/migrations";
const file = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
let out = "-- Generato da `npm run db:sql`. Non modificare: modifica le migrazioni.\n\n";
for (const f of file) out += `-- ===== ${f} =====\n${await readFile(join(dir, f), "utf8")}\n\n`;
await mkdir("supabase/.generato", { recursive: true });
await writeFile("supabase/.generato/setup.sql", out);
console.log(`Creato supabase/.generato/setup.sql (${file.length} migrazioni).`);
