import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não definida (necessária para drizzle-kit)");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./drizzle/schema/index.ts",
  out: "./drizzle/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
