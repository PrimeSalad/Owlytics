// Applies migrations/00_master_schema.sql to the Supabase Postgres database.
// Usage:
//   SUPABASE_DB_URL="postgresql://postgres:PASSWORD@db.<ref>.supabase.co:5432/postgres" node apply_schema.mjs
// or pass the connection string as the first argument:
//   node apply_schema.mjs "postgresql://postgres:PASSWORD@db.<ref>.supabase.co:5432/postgres"
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, '..', 'migrations', '00_master_schema.sql');

const connectionString = process.argv[2] || process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error('ERROR: provide the connection string via SUPABASE_DB_URL or as the first argument.');
  process.exit(1);
}

const sql = readFileSync(sqlPath, 'utf8');

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log('Connected. Applying 00_master_schema.sql …');
  await client.query(sql);
  console.log('✅ Schema applied successfully.');
} catch (err) {
  console.error('❌ Failed to apply schema:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
