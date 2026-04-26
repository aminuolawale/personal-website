import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Returns a new Drizzle client on every call.
// A module-level singleton would be reused across hot-reloads in dev and across
// serverless invocations in prod in unpredictable ways. Neon's HTTP driver is
// stateless (no persistent connection), so the overhead of calling this per
// request is negligible.
export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const sql = neon(url);
  return drizzle(sql, { schema });
}
