#!/usr/bin/env node
// Usage:
//   npm run db:push           → push using .env.local as-is
//   npm run db:push --prod    → swap DATABASE_URL from .env.prod.forsync, push, revert

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const isProd = process.env.npm_config_prod === "true";
const root = path.resolve(__dirname, "..");
const envLocal = path.join(root, ".env.local");
const envProd = path.join(root, ".env.prod.forsync");

function parseUrl(envContent) {
  const match = envContent.match(/^DATABASE_URL=(.+)$/m);
  if (!match) throw new Error("DATABASE_URL not found");
  return match[1].trim();
}

function swapUrl(envContent, newUrl) {
  if (/^DATABASE_URL=.*/m.test(envContent)) {
    return envContent.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=${newUrl}`);
  }
  return envContent + `\nDATABASE_URL=${newUrl}`;
}

if (isProd) {
  if (!fs.existsSync(envProd)) {
    console.error("Error: .env.prod.forsync not found");
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
