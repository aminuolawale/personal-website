import fs from "fs";
import path from "path";
import os from "os";
import type { AgentSession, SessionTurn } from "./types";

// ~/.claude/projects/ encodes the working dir as the path with every "/" replaced by "-".
function encodeProjectPath(workingDir: string): string {
  return workingDir.replace(/\//g, "-");
}

function getProjectDir(workingDir: string): string {
  return path.join(os.homedir(), ".claude", "projects", encodeProjectPath(workingDir));
}

interface ClaudeMessage {
  type: "user" | "assistant";
  uuid: string;
  parentUuid: string | null;
  isSidechain: boolean;
  sessionId: string;
  timestamp: string;
  cwd?: string;
  message?: {
    role: string;
    content: unknown;
    usage?: {
      input_tokens: number;
      output_tokens: number;
      cache_read_input_tokens?: number;
      cache_creation_input_tokens?: number;
    };
  };
}

function extractText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((c): c is { type: string; text: string } => c?.type === "text")
      .map((c) => c.text)
      .join("\n")
      .trim();
  }
  return "";
}

function parseSessionFile(filePath: string): ClaudeMessage[] {
  try {
    return fs
      .readFileSync(filePath, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try { return JSON.parse(line); } catch { return null; }
      })
      .filter((m): m is ClaudeMessage => m?.type === "user" || m?.type === "assistant");
  } catch {
    return [];
  }
}

export function readClaudeCodeSessions(
  workingDir: string,
  fromTime: Date,
  toTime: Date,
): AgentSession[] {
  const projectDir = getProjectDir(workingDir);
  if (!fs.existsSync(projectDir)) return [];

  const jsonlFiles = fs
    .readdirSync(projectDir)
    .filter((f) => f.endsWith(".jsonl"))
    .map((f) => path.join(projectDir, f));

  const sessions: AgentSession[] = [];

  for (const file of jsonlFiles) {
    const messages = parseSessionFile(file);
    if (messages.length === 0) continue;

    // Group by sessionId; only keep messages in this cwd and time window.
    const bySession = new Map<string, ClaudeMessage[]>();
    for (const msg of messages) {
      if (msg.cwd && msg.cwd !== workingDir) continue;
      const ts = new Date(msg.timestamp);
      if (ts < fromTime || ts > toTime) continue;
      const bucket = bySession.get(msg.sessionId) ?? [];
      bucket.push(msg);
      bySession.set(msg.sessionId, bucket);
    }

    for (const [sessionId, msgs] of bySession) {
      if (msgs.length === 0) continue;
      // Drop sidechain messages to keep only the main conversation thread.
      const mainThread = msgs.filter((m) => !m.isSidechain);
      if (mainThread.length === 0) continue;

      const sorted = mainThread.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

      const turns: SessionTurn[] = [];
      let idx = 0;

      for (const msg of sorted) {
        const usage = msg.message?.usage;
        const text =
          msg.type === "user"
            ? extractText(msg.message?.content)
            : extractText(msg.message?.content);

        if (!text) continue;

        turns.push({
          index: idx++,
          role: msg.type === "user" ? "user" : "assistant",
          text,
          timestamp: new Date(msg.timestamp),
          inputTokens: usage?.input_tokens ?? 0,
          outputTokens: usage?.output_tokens ?? 0,
          cachedTokens:
            (usage?.cache_read_input_tokens ?? 0) +
            (usage?.cache_creation_input_tokens ?? 0),
        });
      }

      if (turns.length === 0) continue;

      sessions.push({
        sessionId,
        agent: "claude-code",
        startTime: new Date(sorted[0].timestamp),
        endTime: new Date(sorted[sorted.length - 1].timestamp),
        workingDir,
        turns,
      });
    }
  }

  return sessions;
}
