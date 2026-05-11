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

  // Collect all in-window turns grouped by sessionId.
  // Every session with any activity in [fromTime, toTime] for this workspace
  // contributes to the commit's conversation.
  const sessionTurns = new Map<string, ClaudeMessage[]>();

  for (const file of jsonlFiles) {
    for (const msg of parseSessionFile(file)) {
      if (msg.isSidechain) continue;
      if (msg.cwd && msg.cwd !== workingDir) continue;
      const ts = new Date(msg.timestamp);
      if (ts < fromTime || ts > toTime) continue;
      const existing = sessionTurns.get(msg.sessionId) ?? [];
      existing.push(msg);
      sessionTurns.set(msg.sessionId, existing);
    }
  }

  const result: AgentSession[] = [];

  for (const [sessionId, msgs] of sessionTurns) {
    const sorted = [...msgs].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    const turns: SessionTurn[] = [];
    let idx = 0;

    // Claude Code stores one message per content block (thinking / text / tool_use)
    // for each API call. Messages from the same API call share identical
    // (input, output, cache_read, cache_creation) token counts. Group consecutive
    // assistant messages by that usage key so every API call's tokens are counted
    // exactly once — including tool-only calls that carry no text.
    let pendingGroup: SessionTurn | null = null;
    let pendingGroupKey: string | null = null;

    const flushGroup = () => {
      if (pendingGroup) {
        turns.push(pendingGroup);
        pendingGroup = null;
        pendingGroupKey = null;
      }
    };

    for (const msg of sorted) {
      if (msg.type === "user") {
        flushGroup();
        const text = extractText(msg.message?.content);
        if (!text) continue; // tool_result messages have no user-visible text
        turns.push({
          index: idx++,
          role: "user",
          text,
          timestamp: new Date(msg.timestamp),
          inputTokens: 0,
          outputTokens: 0,
          cachedTokens: 0,
        });
      } else if (msg.type === "assistant") {
        const usage = msg.message?.usage;
        const key = `${usage?.input_tokens ?? 0}:${usage?.output_tokens ?? 0}:${usage?.cache_read_input_tokens ?? 0}:${usage?.cache_creation_input_tokens ?? 0}`;
        const text = extractText(msg.message?.content);

        if (key === pendingGroupKey && pendingGroup) {
          // Same API call — adopt the first text-bearing message's content.
          if (!pendingGroup.text && text) {
            pendingGroup.text = text;
            pendingGroup.timestamp = new Date(msg.timestamp);
          }
        } else {
          flushGroup();
          pendingGroupKey = key;
          pendingGroup = {
            index: idx++,
            role: "assistant",
            text,
            timestamp: new Date(msg.timestamp),
            inputTokens: usage?.input_tokens ?? 0,
            outputTokens: usage?.output_tokens ?? 0,
            cachedTokens:
              (usage?.cache_read_input_tokens ?? 0) +
              (usage?.cache_creation_input_tokens ?? 0),
          };
        }
      }
    }
    flushGroup();

    if (turns.length === 0) continue;

    result.push({
      sessionId,
      agent: "claude-code",
      startTime: turns[0].timestamp,
      endTime: turns[turns.length - 1].timestamp,
      workingDir,
      turns,
    });
  }

  return result;
}
