import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function initTables() {
  await client.execute(`CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    source TEXT NOT NULL DEFAULT 'otro',
    temperature TEXT NOT NULL DEFAULT 'cold',
    score INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`);
  await client.execute(`CREATE TABLE IF NOT EXISTS pipeline_stages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    color TEXT NOT NULL DEFAULT '#64748b',
    is_won INTEGER NOT NULL DEFAULT 0,
    is_lost INTEGER NOT NULL DEFAULT 0
  )`);
  await client.execute(`CREATE TABLE IF NOT EXISTS deals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    value INTEGER NOT NULL DEFAULT 0,
    stage_id TEXT NOT NULL REFERENCES pipeline_stages(id),
    contact_id TEXT NOT NULL REFERENCES contacts(id),
    expected_close INTEGER,
    probability INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`);
  await client.execute(`CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    contact_id TEXT NOT NULL REFERENCES contacts(id),
    deal_id TEXT REFERENCES deals(id),
    scheduled_at INTEGER,
    completed_at INTEGER,
    created_at INTEGER NOT NULL
  )`);
  await client.execute(`CREATE TABLE IF NOT EXISTS crm_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`);

  const result = await client.execute("SELECT COUNT(*) as count FROM pipeline_stages");
  const count = result.rows[0]?.count as number;

  if (!count || count === 0) {
    const stages = [
      { name: "Nuevo Lead", order: 1, color: "#64748b", isWon: 0, isLost: 0 },
      { name: "Primer Contacto", order: 2, color: "#2563eb", isWon: 0, isLost: 0 },
      { name: "Cotizacion Enviada", order: 3, color: "#8b5cf6", isWon: 0, isLost: 0 },
      { name: "En Negociacion", order: 4, color: "#ea580c", isWon: 0, isLost: 0 },
      { name: "Pago Recibido", order: 5, color: "#0891b2", isWon: 0, isLost: 0 },
      { name: "En Desarrollo", order: 6, color: "#7c3aed", isWon: 0, isLost: 0 },
      { name: "Entregado", order: 7, color: "#16a34a", isWon: 1, isLost: 0 },
      { name: "Perdido", order: 8, color: "#dc2626", isWon: 0, isLost: 1 },
    ];
    for (const s of stages) {
      await client.execute({
        sql: `INSERT INTO pipeline_stages (id, name, "order", color, is_won, is_lost) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [crypto.randomUUID(), s.name, s.order, s.color, s.isWon, s.isLost],
      });
    }
  }
}

initTables().catch(console.error);

export const db = drizzle(client, { schema });
