import pg from "pg";
import bcrypt from "bcryptjs";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não definida");
}
if (!process.env.SEED_USERNAME || !process.env.SEED_PASSWORD) {
  throw new Error("SEED_USERNAME e SEED_PASSWORD precisam estar definidas");
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const DEFAULT_TEMPLATES = [
  {
    networkKey: "twitter_x",
    label: "Twitter",
    templateText: "{{titulo}}\n\n{{link}}",
  },
  {
    networkKey: "youtube",
    label: "YouTube",
    templateText: "📰 {{titulo}}\n{{subtitulo}}\n\n🔗 {{link}}",
  },
  {
    networkKey: "facebook",
    label: "Canal do Facebook",
    templateText: "{{titulo}}\n\n{{subtitulo}}\n\n{{link}}",
  },
  {
    networkKey: "gettr",
    label: "Gettr",
    templateText: "{{titulo}}\n\n{{subtitulo}}\n\nLeia mais: {{link}}",
  },
];

async function seedUser(client) {
  const { rows } = await client.query(
    "SELECT 1 FROM users WHERE username = $1",
    [process.env.SEED_USERNAME],
  );
  if (rows.length > 0) {
    console.log(`[seed] usuário "${process.env.SEED_USERNAME}" já existe, pulando.`);
    return;
  }
  const passwordHash = await bcrypt.hash(process.env.SEED_PASSWORD, 10);
  await client.query(
    "INSERT INTO users (username, password_hash) VALUES ($1, $2)",
    [process.env.SEED_USERNAME, passwordHash],
  );
  console.log(`[seed] usuário "${process.env.SEED_USERNAME}" criado.`);
}

async function seedTemplates(client) {
  for (const t of DEFAULT_TEMPLATES) {
    await client.query(
      `INSERT INTO templates (network_key, label, template_text)
       VALUES ($1, $2, $3)
       ON CONFLICT (network_key) DO NOTHING`,
      [t.networkKey, t.label, t.templateText],
    );
  }
  console.log("[seed] templates padrão garantidos (sem sobrescrever edições existentes).");
}

const client = await pool.connect();
try {
  await seedUser(client);
  await seedTemplates(client);
} finally {
  client.release();
  await pool.end();
}
