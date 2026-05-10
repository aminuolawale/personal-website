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
  created_at: number; // Unix seconds
  updated_at: number; // Unix seconds
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
    // updated_at is stored as Unix SECONDS (integer). Convert JS ms timestamps.
    const fromS = Math.floor(fromTime.getTime() / 1000);
    const toS = Math.floor(toTime.getTime() / 1000);

    const rows: CodexThread[] = commitSha
      ? (db
          .prepare(
            `SELECT id, cwd, created_at, updated_at, tokens_used, git_sha, first_user_message
             FROM threads
             WHERE git_sha = ? OR (cwd = ? AND updated_at BETWEEN ? AND ?)`,
          )
          .all(commitSha, workingDir, fromS, toS) as CodexThread[])
      : (db
          .prepare(
            `SELECT id, cwd, created_at, updated_at, tokens_used, git_sha, first_user_message
             FROM threads
             WHERE cwd = ? AND updated_at BETWEEN ? AND ?`,
          )
          .all(workingDir, fromS, toS) as CodexThread[]);

    // Separate sha-linked threads (definitively tied to this commit) from
    // window-matched threads. For window-matched threads apply the same
    // active-session-at-commit-time rule: pick the single thread most
    // recently updated before toTime (mirrors the Claude Code / Gemini logic).
    const shaLinked = commitSha ? rows.filter((r) => r.git_sha === commitSha) : [];
    const shaLinkedIds = new Set(shaLinked.map((r) => r.id));
    const windowOnly = rows.filter((r) => !shaLinkedIds.has(r.id));

    let activeWindowThread: CodexThread | null = null;
    let latestUpdatedS = 0;
    for (const r of windowOnly) {
      if (!r.tokens_used || r.tokens_used <= 0) continue;
      if (r.updated_at <= toS && r.updated_at > latestUpdatedS) {
        latestUpdatedS = r.updated_at;
        activeWindowThread = r;
      }
    }

    const selectedRows = [
      ...shaLinked.filter((r) => r.tokens_used && r.tokens_used > 0),
      ...(activeWindowThread ? [activeWindowThread] : []),
    ];

    return selectedRows.map((r): AgentSession => {
        const startTime = new Date(r.created_at * 1000);
        const endTime = new Date(r.updated_at * 1000);
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
          inputTokens: totalTokens, // lumped into input; output unknown
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
