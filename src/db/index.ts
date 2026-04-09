import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function initTables() {
  await client.execute(`CREATE TABLE IF NOT EXISTS contacts (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT, phone TEXT, company TEXT, source TEXT NOT NULL DEFAULT 'otro', temperature TEXT NOT NULL DEFAULT 'cold', score INTEGER NOT NULL DEFAULT 0, notes TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`);
  await client.execute(`CREATE TABLE IF NOT EXISTS pipeline_stages (id TEXT PRIMARY KEY, name TEXT NOT NULL, "order" INTEGER NOT NULL, color TEXT NOT NULL DEFAULT '#64748b', is_won INTEGER NOT NULL DEFAULT 0, is_lost INTEGER NOT NULL DEFAULT 0)`);
  await client.execute(`CREATE TABLE IF NOT EXISTS deals (id TEXT PRIMARY KEY, title TEXT NOT NULL, value INTEGER NOT NULL DEFAULT 0, stage_id TEXT NOT NULL REFERENCES pipeline_stages(id), contact_id TEXT NOT NULL REFERENCES contacts(id), expected_close INTEGER, probability INTEGER NOT NULL DEFAULT 0, notes TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`);
  await client.execute(`CREATE TABLE IF NOT EXISTS activities (id TEXT PRIMARY KEY, type TEXT NOT NULL, description TEXT NOT NULL, contact_id TEXT NOT NULL REFERENCES contacts(id), deal_id TEXT REFERENCES deals(id), scheduled_at INTEGER, completed_at INTEGER, created_at INTEGER NOT NULL)`);
  await client.execute(`CREATE TABLE IF NOT EXISTS crm_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);
}

initTables().catch(console.error);

export const db = drizzle(client, { schema });
