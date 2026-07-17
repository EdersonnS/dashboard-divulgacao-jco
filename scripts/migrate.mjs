import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não definida");
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Em um restart de VPS, os containers sobem juntos (sem respeitar a ordem do
// depends_on/healthcheck do docker-compose, que só vale no `up`). Espera o
// Postgres aceitar conexões antes de rodar as migrations, em vez de depender
// só do restart-policy do container para tentar de novo.
async function waitForDatabase(maxAttempts = 15, delayMs = 2000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await pool.query("SELECT 1");
      return;
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      console.log(
        `[migrate] banco ainda não respondeu (tentativa ${attempt}/${maxAttempts}), tentando de novo em ${delayMs}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

await waitForDatabase();

const db = drizzle(pool);

await migrate(db, {
  migrationsFolder: path.join(__dirname, "..", "drizzle", "migrations"),
});

await pool.end();
console.log("[migrate] migrations aplicadas com sucesso.");
