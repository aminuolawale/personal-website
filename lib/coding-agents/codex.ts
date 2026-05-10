import fs from "fs";
import path from "path";
import os from "os";
import type { AgentSession, SessionTurn } from "./types";

function getDbPath(): string {
  return path.join(os.homedir(), ".codex", "state_5.sqlite");
}

interface CodexThread {
  id: string;
  cwd: string;
  created_at: string;
  updated_at: string;
  tokens_used: number | null;
  git_sha: string | null;
  first_user_message: string | null;
}

// Uses dynamic require for better-sqlite3 so the module can be imported in
// Next.js without crashing when the native addon isn't available in the bundle.
function openDb(): import("better-sqlite3").Database | null {
  try {
    const dbPath = getDbPath();
    if (!fs.existsSync(dbPath)) return null;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("better-sqlite3");
    // Handle both CJS (module.exports = Database) and ESM default interop
    const Database = typeof mod === "function" ? mod : (mod.default ?? mod);
    return new Database(dbPath, { readonly: true });
  } catch {
    return null;
  }
}

export function readCodexSessions(
  workingDir: string,
  fromTime: Date,
  toTime: Date,
  commitSha?: string,
): AgentSession[] {
  const db = openDb();
  if (!db) return [];

  try {
    const rows: CodexThread[] = commitSha
      ? (db
          .prepare(
            `SELECT id, cwd, created_at, updated_at, tokens_used, git_sha, first_user_message
             FROM threads
             WHERE git_sha = ? OR (cwd = ? AND created_at BETWEEN ? AND ?)`,
          )
          .all(
            commitSha,
            workingDir,
            fromTime.toISOString(),
            toTime.toISOString(),
          ) as CodexThread[])
      : (db
          .prepare(
            `SELECT id, cwd, created_at, updated_at, tokens_used, git_sha, first_user_message
             FROM threads
             WHERE cwd = ? AND created_at BETWEEN ? AND ?`,
          )
          .all(
            workingDir,
            fromTime.toISOString(),
            toTime.toISOString(),
          ) as CodexThread[]);

    return rows
      .filter((r) => r.tokens_used && r.tokens_used > 0)
      .map((r): AgentSession => {
        const startTime = new Date(r.created_at);
        const endTime = new Date(r.updated_at);
        const totalTokens = r.tokens_used ?? 0;

        // Codex only exposes a per-thread token total — no per-turn breakdown.
        // We model the whole thread as a single "assistant" turn.
        const turns: SessionTurn[] = [];
        if (r.first_user_message) {
          turns.push({
            index: 0,
            role: "user",
            text: r.first_user_message,
            timestamp: startTime,
            inputTokens: 0,
            outputTokens: 0,
            cachedTokens: 0,
          });
        }
        turns.push({
          index: turns.length,
          role: "assistant",
          text: "",
          timestamp: endTime,
          inputTokens: totalTokens,  // lumped into input; output unknown
          outputTokens: 0,
          cachedTokens: 0,
        });

        return {
          sessionId: r.id,
          agent: "codex",
          startTime,
          endTime,
          workingDir,
          turns,
        };
      });
  } finally {
    db.close();
  }
}
