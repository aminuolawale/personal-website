// @vitest-environment node
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const { TEST_HOME } = vi.hoisted(() => ({
  TEST_HOME: `/tmp/vitest-codex-home-${process.pid}`,
}));

vi.mock("os", () => ({
  default: { homedir: () => TEST_HOME, tmpdir: () => "/tmp" },
  homedir: () => TEST_HOME,
  tmpdir: () => "/tmp",
}));

import { readCodexSessions } from "@/lib/coding-agents/codex";

// Use a real SQLite database at the same path the Codex reader opens.
const DB_PATH = path.join(TEST_HOME, ".codex", "state_5.sqlite");
const WORKING_DIR = "/projects/myapp";
const FROM = new Date("2026-04-25T09:00:00Z");
const TO = new Date("2026-04-25T12:00:00Z");

function seedDb(db: Database.Database, rows: object[]) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS threads (
      id TEXT PRIMARY KEY,
      cwd TEXT,
      created_at TEXT,
      updated_at TEXT,
      tokens_used INTEGER,
      git_sha TEXT,
      first_user_message TEXT
    )
  `);
  db.exec("DELETE FROM threads");
  const insert = db.prepare(
    "INSERT INTO threads VALUES (@id, @cwd, @created_at, @updated_at, @tokens_used, @git_sha, @first_user_message)"
  );
  for (const row of rows) insert.run(row);
}

describe("readCodexSessions", () => {
  beforeEach(() => {
    fs.rmSync(TEST_HOME, { recursive: true, force: true });
  });

  it("returns [] when the SQLite database file does not exist", () => {
    expect(readCodexSessions(WORKING_DIR, FROM, TO)).toEqual([]);
  });

  describe("with a real database", () => {
    let db: Database.Database;

    beforeAll(() => {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      db = new Database(DB_PATH);
      seedDb(db, []);
      db.close();
    });

    afterAll(() => {
      fs.rmSync(TEST_HOME, { recursive: true, force: true });
    });

    beforeEach(() => {
      // Re-open, clear, and re-seed for each test
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      db = new Database(DB_PATH);
      seedDb(db, []);
      db.close();
    });

    afterEach(() => {
      try { db?.close(); } catch { /* ignore */ }
    });

    it("returns [] when no threads are present", () => {
      // DB exists but is empty
      expect(readCodexSessions(WORKING_DIR, FROM, TO)).toEqual([]);
    });

    it("filters out threads with zero or null tokens_used", () => {
      db = new Database(DB_PATH);
      seedDb(db, [
        { id: "t1", cwd: WORKING_DIR, created_at: "2026-04-25T10:00:00.000Z", updated_at: "2026-04-25T10:30:00.000Z", tokens_used: 0, git_sha: null, first_user_message: null },
        { id: "t2", cwd: WORKING_DIR, created_at: "2026-04-25T10:00:00.000Z", updated_at: "2026-04-25T10:30:00.000Z", tokens_used: null, git_sha: null, first_user_message: null },
      ]);
      db.close();

      expect(readCodexSessions(WORKING_DIR, FROM, TO)).toHaveLength(0);
    });

    it("maps a valid thread to an AgentSession with correct structure", () => {
      db = new Database(DB_PATH);
      seedDb(db, [{
        id: "thread-1",
        cwd: WORKING_DIR,
        created_at: "2026-04-25T10:00:00.000Z",
        updated_at: "2026-04-25T10:30:00.000Z",
        tokens_used: 1500,
        git_sha: null,
        first_user_message: "Implement dark mode",
      }]);
      db.close();

      const sessions = readCodexSessions(WORKING_DIR, FROM, TO);
      expect(sessions).toHaveLength(1);
      const session = sessions[0];
      expect(session.agent).toBe("codex");
      expect(session.sessionId).toBe("thread-1");
      expect(session.workingDir).toBe(WORKING_DIR);
      expect(session.turns[0].role).toBe("user");
      expect(session.turns[0].text).toBe("Implement dark mode");
      expect(session.turns[1].role).toBe("assistant");
      expect(session.turns[1].inputTokens).toBe(1500);
    });

    it("includes threads matching by git_sha when commitSha is provided", () => {
      db = new Database(DB_PATH);
      seedDb(db, [
        {
          id: "sha-match",
          cwd: "/other/dir",
          created_at: "2026-04-25T10:00:00.000Z",
          updated_at: "2026-04-25T10:30:00.000Z",
          tokens_used: 500,
          git_sha: "abc123",
          first_user_message: "SHA match",
        },
        {
          id: "no-sha",
          cwd: WORKING_DIR,
          created_at: "2026-04-25T10:00:00.000Z",
          updated_at: "2026-04-25T10:30:00.000Z",
          tokens_used: 300,
          git_sha: null,
          first_user_message: "Time window match",
        },
      ]);
      db.close();

      const sessions = readCodexSessions(WORKING_DIR, FROM, TO, "abc123");
      expect(sessions).toHaveLength(2); // SHA match (from /other/dir) + cwd match
    });
  });
});
