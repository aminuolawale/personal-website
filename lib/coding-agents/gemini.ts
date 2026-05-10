import fs from "fs";
import path from "path";
import os from "os";
import type { AgentSession, SessionTurn } from "./types";

// Gemini stores sessions under ~/.gemini/tmp/<project-name>/chats/
// where <project-name> is the basename of the working directory.
function getChatsDir(workingDir: string): string {
  const projectName = path.basename(workingDir);
  return path.join(os.homedir(), ".gemini", "tmp", projectName, "chats");
}

interface GeminiLine {
  sessionId?: string;
  startTime?: string;
  kind?: string;
  id?: string;
  timestamp?: string;
  type?: string;
  content?: Array<{ text: string }> | string;
  tokens?: {
    input: number;
    output: number;
    cached: number;
    thoughts?: number;
    total: number;
  };
}

function parseSessionFile(filePath: string): GeminiLine[] {
  try {
    return fs
      .readFileSync(filePath, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try { return JSON.parse(line); } catch { return null; }
      })
      .filter((l): l is GeminiLine => l !== null);
  } catch {
    return [];
  }
}

function extractText(content: GeminiLine["content"]): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((c) => c.text).join("\n").trim();
  return "";
}

export function readGeminiSessions(
  workingDir: string,
  fromTime: Date,
  toTime: Date,
): AgentSession[] {
  const chatsDir = getChatsDir(workingDir);
  if (!fs.existsSync(chatsDir)) return [];

  const files = fs
    .readdirSync(chatsDir)
    .filter((f) => f.endsWith(".jsonl"))
    .map((f) => path.join(chatsDir, f));

  const sessions: AgentSession[] = [];

  for (const file of files) {
    const lines = parseSessionFile(file);
    if (lines.length === 0) continue;

    // First line is the session header: {sessionId, startTime, kind:"main"}
    const header = lines[0];
    if (!header.startTime) continue;

    const sessionStart = new Date(header.startTime);
    if (sessionStart < fromTime || sessionStart > toTime) continue;

    const sessionId = header.sessionId ?? path.basename(file, ".jsonl");
    const turns: SessionTurn[] = [];
    let idx = 0;

    const messageLinesInWindow = lines.slice(1).filter((l) => {
      if (!l.timestamp) return false;
      const ts = new Date(l.timestamp);
      return ts >= fromTime && ts <= toTime;
    });

    for (const line of messageLinesInWindow) {
      if (line.type === "user") {
        const text = extractText(line.content);
        if (!text) continue;
        turns.push({
          index: idx++,
          role: "user",
          text,
          timestamp: new Date(line.timestamp!),
          inputTokens: 0,
          outputTokens: 0,
          cachedTokens: 0,
        });
      } else if (line.type === "gemini") {
        const text = extractText(line.content);
        const tok = line.tokens;
        // thoughts are billed as output tokens
        const outputTokens = (tok?.output ?? 0) + (tok?.thoughts ?? 0);
        turns.push({
          index: idx++,
          role: "assistant",
          text,
          timestamp: new Date(line.timestamp!),
          inputTokens: tok?.input ?? 0,
          outputTokens,
          cachedTokens: tok?.cached ?? 0,
        });
      }
    }

    if (turns.length === 0) continue;

    const timestamps = turns.map((t) => t.timestamp.getTime());
    sessions.push({
      sessionId,
      agent: "gemini",
      startTime: new Date(Math.min(...timestamps)),
      endTime: new Date(Math.max(...timestamps)),
      workingDir,
      turns,
    });
  }

  return sessions;
}
