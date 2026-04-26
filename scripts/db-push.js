#!/usr/bin/env node
/**
 * db-push.js — Drizzle schema push wrapper
 *
 * Usage:
 *   npm run db:push           Push schema to the database in .env.local
 *   npm run db:push --prod    Push schema to the production database
 *
 * How --prod works:
 *   1. Reads DATABASE_URL from .env.prod.forsync (gitignored, never committed).
 *   2. Temporarily writes it into .env.local so drizzle-kit picks it up.
 *   3. Runs drizzle-kit push.
 *   4. Restores the original .env.local (runs in a finally block, so the
 *      revert happens even if the push fails).
 *
 * Why not just pass DATABASE_URL inline?
 *   drizzle-kit reads credentials from .env.local via drizzle.config.ts.
 *   There is no first-class way to override DATABASE_URL from the CLI without
 *   modifying that file, so we do the swap-and-revert approach instead.
 *
 * Detection of --prod:
 *   npm sets npm_config_prod=true in the environment when you pass --prod to
 *   any script, so we read process.env.npm_config_prod rather than argv.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const isProd = process.env.npm_config_prod === "true";
const root = path.resolve(__dirname, "..");
const envLocal = path.join(root, ".env.local");
const envProd = path.join(root, ".env.prod.forsync");

function parseUrl(envContent) {
  const match = envContent.match(/^DATABASE_URL=(.+)$/m);
  if (!match) throw new Error("DATABASE_URL not found in " + envProd);
  return match[1].trim();
}

function swapUrl(envContent, newUrl) {
  if (/^DATABASE_URL=.*/m.test(envContent)) {
    return envContent.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=${newUrl}`);
  }
  // DATABASE_URL not yet present — append it
  return envContent + `\nDATABASE_URL=${newUrl}`;
}

if (isProd) {
  if (!fs.existsSync(envProd)) {
    console.error("Error: .env.prod.forsync not found. Create it with DATABASE_URL=<prod-url>.");
    process.exit(1);
  }
  const prodUrl = parseUrl(fs.readFileSync(envProd, "utf8"));
  const original = fs.existsSync(envLocal) ? fs.readFileSync(envLocal, "utf8") : "";
  console.log("→ Swapping DATABASE_URL to production…");
  fs.writeFileSync(envLocal, swapUrl(original, prodUrl));
  try {
    execSync("npx drizzle-kit push", { stdio: "inherit", cwd: root });
  } finally {
    fs.writeFileSync(envLocal, original);
    console.log("→ Reverted .env.local");
  }
} else {
  execSync("npx drizzle-kit push", { stdio: "inherit", cwd: root });
}
