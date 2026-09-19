import { readFileSync } from "node:fs";
import type { Config } from "drizzle-kit";

// drizzle-kit does not read .env.local on its own, and we would rather not add
// a dotenv dependency just for this. Read the key directly when it is absent.
function databaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const line = readFileSync(".env.local", "utf8")
      .split("\n")
      .find((l) => l.startsWith("DATABASE_URL="));
    if (line) return line.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "");
  } catch {
    // fall through to the error below
  }
  throw new Error("DATABASE_URL is not set. Add it to .env.local.");
}

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: databaseUrl() },
} satisfies Config;
