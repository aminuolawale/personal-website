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
    const allLines = fs
      .readFileSync(filePath, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try { return JSON.parse(line); } catch { return null; }
      })
      // Drop unparseable lines and MongoDB-style $set update ops.
      .filter((l): l is GeminiLine => l !== null && !("$set" in (l as object)));

    // Gemini writes every message twice: once on emission (no toolCalls) and
    // again after the tool calls are resolved (with toolCalls populated).
    // Both occurrences share the same `id` and identical token counts.
    // Deduplicate by id, keeping the last occurrence (most complete data).
    const lastById = new Map<string, GeminiLine>();
    const insertionOrder: string[] = [];

    for (const line of allLines) {
      if (!line.id) continue; // header and other id-less lines handled below
      if (!lastById.has(line.id)) insertionOrder.push(line.id);
      lastById.set(line.id, line);
    }

    const idLessLines = allLines.filter((l) => !l.id); // header(s)
    return [...idLessLines, ...insertionOrder.map((id) => lastById.get(id)!)];
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

  // Pass 1: Find the chat file most recently active at toTime (commit time).
  // The message line with the latest timestamp ≤ toTime identifies the session
  // that was in use when the commit was made.
  let activeFile: string | null = null;
  let activeLatestTs = new Date(0);

  for (const file of files) {
    const lines = parseSessionFile(file);
    for (const line of lines.slice(1)) { // skip header
      if (!line.timestamp) continue;
      const ts = new Date(line.timestamp);
      if (ts > toTime) continue;
      if (ts > activeLatestTs) {
        activeLatestTs = ts;
        activeFile = file;
      }
    }
  }

  if (!activeFile) return [];

  // Pass 2: Extract turns from the active session within [fromTime, toTime].
  const lines = parseSessionFile(activeFile);
  const header = lines[0];
  if (!header?.startTime) return [];

  const sessionId = header.sessionId ?? path.basename(activeFile, ".jsonl");
  const turns: SessionTurn[] = [];
  let idx = 0;

  for (const line of lines.slice(1)) {
    if (!line.timestamp) continue;
    const ts = new Date(line.timestamp);
    if (ts < fromTime || ts > toTime) continue;

    if (line.type === "user") {
      const text = extractText(line.content);
      if (!text) continue;
      turns.push({
        index: idx++,
        role: "user",
        text,
        timestamp: ts,
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
        timestamp: ts,
        inputTokens: tok?.input ?? 0,
        outputTokens,
        cachedTokens: tok?.cached ?? 0,
      });
    }
  }

  if (turns.length === 0) return [];

  return [{
    sessionId,
    agent: "gemini",
    startTime: turns[0].timestamp,
    endTime: turns[turns.length - 1].timestamp,
    workingDir,
    turns,
  }];
}
