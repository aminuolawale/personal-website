import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

// drizzle-kit runs as a standalone CLI tool, not through Next.js, so it does
// not pick up .env.local automatically. We load it explicitly here.
dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
