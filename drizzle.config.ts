import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run Drizzle commands.");
}

export default defineConfig({
  out: "./src/server/db/migrations",
  schema: "./src/server/db/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
