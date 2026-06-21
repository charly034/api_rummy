import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, "../migrations");

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const ensureMigrationsTable = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         SERIAL PRIMARY KEY,
      filename   VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `);
};

const getAppliedMigrations = async (client) => {
  const { rows } = await client.query(
    "SELECT filename FROM _migrations ORDER BY filename ASC"
  );
  return new Set(rows.map((r) => r.filename));
};

const run = async () => {
  const client = await pool.connect();

  try {
    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);

    const files = (await fs.readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith(".sql"))
      .sort();

    const pending = files.filter((f) => !applied.has(f));

    if (!pending.length) {
      console.log("No hay migraciones pendientes.");
      return;
    }

    for (const filename of pending) {
      const filepath = path.join(MIGRATIONS_DIR, filename);
      const sql = await fs.readFile(filepath, "utf8");

      console.log(`Aplicando: ${filename}`);
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        "INSERT INTO _migrations (filename) VALUES ($1)",
        [filename]
      );
      await client.query("COMMIT");
      console.log(`OK: ${filename}`);
    }

    console.log("Migraciones completadas.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error en migración:", error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

run();
