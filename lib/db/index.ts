import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to .env.local (see .env.example).");
}

// Reuse one client across hot reloads in dev and across warm serverless
// invocations in production, so we don't exhaust the connection pool.
//
// max: 1 is deliberate. Supabase's session pooler allows 15 clients, and both
// `next build` (6 workers) and Vercel (many lambdas) open a client each. One
// connection per client keeps us well inside that budget, and a serverless
// function only ever serves one request at a time anyway.
const globalForDb = globalThis as unknown as { blazeClient?: ReturnType<typeof postgres> };
const client =
  globalForDb.blazeClient ??
  postgres(connectionString, { prepare: false, max: 1, idle_timeout: 20 });
if (process.env.NODE_ENV !== "production") globalForDb.blazeClient = client;

export const db = drizzle(client, { schema });
