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

// Helpers — Unix SECONDS (the actual Codex storage format).
const toS = (iso: string) => Math.floor(new Date(iso).getTime() / 1000);
const FROM_S = Math.floor(FROM.getTime() / 1000);

function seedDb(db: Database.Database, rows: object[]) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS threads (
      id TEXT PRIMARY KEY,
      cwd TEXT,
      created_at INTEGER,
      updated_at INTEGER,
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
      expect(readCodexSessions(WORKING_DIR, FROM, TO)).toEqual([]);
    });

    it("filters out threads with zero or null tokens_used", () => {
      db = new Database(DB_PATH);
      seedDb(db, [
        { id: "t1", cwd: WORKING_DIR, created_at: FROM_S + 3600, updated_at: FROM_S + 5400, tokens_used: 0, git_sha: null, first_user_message: null },
        { id: "t2", cwd: WORKING_DIR, created_at: FROM_S + 3600, updated_at: FROM_S + 5400, tokens_used: null, git_sha: null, first_user_message: null },
      ]);
      db.close();

      expect(readCodexSessions(WORKING_DIR, FROM, TO)).toHaveLength(0);
    });

    it("maps a valid thread to an AgentSession with correct structure", () => {
      db = new Database(DB_PATH);
      seedDb(db, [{
        id: "thread-1",
        cwd: WORKING_DIR,
        created_at: toS("2026-04-25T10:00:00.000Z"),
        updated_at: toS("2026-04-25T10:30:00.000Z"),
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

    it("correctly parses Unix-second timestamps into Date objects", () => {
      const created = toS("2026-04-25T10:00:00.000Z");
      const updated = toS("2026-04-25T10:30:00.000Z");
      db = new Database(DB_PATH);
      seedDb(db, [{
        id: "ts-thread",
        cwd: WORKING_DIR,
        created_at: created,
        updated_at: updated,
        tokens_used: 500,
        git_sha: null,
        first_user_message: "check timestamps",
      }]);
      db.close();

      const sessions = readCodexSessions(WORKING_DIR, FROM, TO);
      expect(sessions).toHaveLength(1);
      // startTime derived from created_at * 1000
      expect(sessions[0].startTime.getTime()).toBe(created * 1000);
      expect(sessions[0].endTime.getTime()).toBe(updated * 1000);
    });

    it("includes threads matching by git_sha when commitSha is provided", () => {
      db = new Database(DB_PATH);
      seedDb(db, [
        {
          id: "sha-match",
          cwd: "/other/dir",
          created_at: toS("2026-04-25T10:00:00.000Z"),
          updated_at: toS("2026-04-25T10:30:00.000Z"),
          tokens_used: 500,
          git_sha: "abc123",
          first_user_message: "SHA match",
        },
        {
          id: "no-sha",
          cwd: WORKING_DIR,
          created_at: toS("2026-04-25T10:00:00.000Z"),
          updated_at: toS("2026-04-25T10:30:00.000Z"),
          tokens_used: 300,
          git_sha: null,
          first_user_message: "Time window match",
        },
      ]);
      db.close();

      const sessions = readCodexSessions(WORKING_DIR, FROM, TO, "abc123");
      expect(sessions).toHaveLength(2); // SHA match (from /other/dir) + active window thread
    });

    // ---- updated_at-based attribution ----

    it("finds a thread that started before fromTime but was still active during the window", () => {
      db = new Database(DB_PATH);
      seedDb(db, [{
        id: "pre-window-thread",
        cwd: WORKING_DIR,
        created_at: toS("2026-04-25T08:00:00.000Z"),  // before fromTime (09:00)
        updated_at: toS("2026-04-25T10:30:00.000Z"),  // inside [fromTime, toTime]
        tokens_used: 750,
        git_sha: null,
        first_user_message: "Started earlier, still active",
      }]);
      db.close();

      const sessions = readCodexSessions(WORKING_DIR, FROM, TO);
      expect(sessions).toHaveLength(1);
      expect(sessions[0].sessionId).toBe("pre-window-thread");
    });

    it("excludes a thread whose last activity (updated_at) falls outside the window", () => {
      db = new Database(DB_PATH);
      seedDb(db, [{
        id: "inactive-thread",
        cwd: WORKING_DIR,
        created_at: toS("2026-04-25T08:00:00.000Z"),
        updated_at: toS("2026-04-25T08:45:00.000Z"),  // before fromTime (09:00)
        tokens_used: 200,
        git_sha: null,
        first_user_message: "Stale work",
      }]);
      db.close();

      expect(readCodexSessions(WORKING_DIR, FROM, TO)).toHaveLength(0);
    });

    // ---- active-session-at-commit-time ----

    it("returns all window-matched threads, not just the most recently active", () => {
      db = new Database(DB_PATH);
      seedDb(db, [
        {
          id: "thread-a",
          cwd: WORKING_DIR,
          created_at: FROM_S + 1800,        // 09:30
          updated_at: FROM_S + 3600,        // 10:00
          tokens_used: 800,
          git_sha: null,
          first_user_message: "Task A",
        },
        {
          id: "thread-b",
          cwd: WORKING_DIR,
          created_at: FROM_S + 3600,        // 10:00
          updated_at: FROM_S + 7200,        // 11:00
          tokens_used: 1200,
          git_sha: null,
          first_user_message: "Task B",
        },
      ]);
      db.close();

      const sessions = readCodexSessions(WORKING_DIR, FROM, TO);
      expect(sessions).toHaveLength(2);
      const ids = sessions.map((s) => s.sessionId);
      expect(ids).toContain("thread-a");
      expect(ids).toContain("thread-b");
    });

    it("includes all sha-linked threads even when a window-matched thread also exists", () => {
      db = new Database(DB_PATH);
      seedDb(db, [
        {
          id: "sha-thread-1",
          cwd: WORKING_DIR,
          created_at: FROM_S + 1800,
          updated_at: FROM_S + 3600,
          tokens_used: 600,
          git_sha: "deadbeef",
          first_user_message: "SHA linked 1",
        },
        {
          id: "sha-thread-2",
          cwd: WORKING_DIR,
          created_at: FROM_S + 3000,
          updated_at: FROM_S + 5400,
          tokens_used: 400,
          git_sha: "deadbeef",
          first_user_message: "SHA linked 2",
        },
        {
          id: "window-thread",
          cwd: WORKING_DIR,
          created_at: FROM_S + 4800,
          updated_at: FROM_S + 7200,
          tokens_used: 900,
          git_sha: null,
          first_user_message: "Window only",
        },
      ]);
      db.close();

      const sessions = readCodexSessions(WORKING_DIR, FROM, TO, "deadbeef");
      // Both sha-linked threads + the active window thread
      expect(sessions).toHaveLength(3);
      const ids = sessions.map((s) => s.sessionId);
      expect(ids).toContain("sha-thread-1");
      expect(ids).toContain("sha-thread-2");
      expect(ids).toContain("window-thread");
    });
  });
});
