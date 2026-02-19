import { readdir, readFile as fsReadFile, stat } from "node:fs/promises";
import { join, sep } from "node:path";
import type { AssistantUsage, RawJSONLLine } from "./types";

export interface ParsedLine {
  sessionId: string;
  timestamp: string;
  model: string;
  usage: AssistantUsage;
  project: string;
  isSubagent: boolean;
  agentId?: string;
}

export interface FileOffsets {
  [filePath: string]: number;
}

/**
 * Derive project name from a JSONL directory path.
 * e.g. "-Users-maximilianwidjaya-Desktop-Code-readme" → "readme"
 */
export function deriveProjectName(dirName: string): string {
  // Directory names use dashes as separators in the Claude projects folder
  // Pattern: -Users-<user>-Desktop-Code-<project>
  // We want the last meaningful segment
  const segments = dirName.split("-").filter(Boolean);
  if (segments.length === 0) return "unknown";

  // Find the segment after "Code" if the standard path pattern exists
  const codeIdx = segments.lastIndexOf("Code");
  if (codeIdx !== -1 && codeIdx < segments.length - 1) {
    // Everything after "Code" is the project name (might have dashes)
    return segments.slice(codeIdx + 1).join("-");
  }

  // Fallback: use the last segment
  return segments[segments.length - 1];
}

/**
 * Strip UTF-8 BOM from a string if present.
 */
function stripBom(content: string): string {
  if (content.charCodeAt(0) === 0xfeff) {
    return content.slice(1);
  }
  return content;
}

const SKIP_TYPES = new Set([
  "file-history-snapshot",
  "progress",
  "queue-operation",
  "system",
  "user",
]);

/**
 * Parse a single JSONL line, returning a ParsedLine if it's a valid assistant message with usage.
 * Returns null for lines that should be skipped.
 */
function parseLine(
  raw: string,
  project: string,
  isSubagent: boolean,
): ParsedLine | null {
  if (!raw.trim()) return null;

  let parsed: RawJSONLLine;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Malformed JSON — skip with warning
    return null;
  }

  if (!parsed.type || SKIP_TYPES.has(parsed.type)) return null;
  if (parsed.type !== "assistant") return null;

  const message = parsed.message as Record<string, unknown> | undefined;
  if (!message) return null;

  const usage = message.usage as AssistantUsage | undefined;
  if (!usage || typeof usage.input_tokens !== "number") return null;

  const model = (message.model as string) ?? "<synthetic>";

  return {
    sessionId: parsed.sessionId,
    timestamp: parsed.timestamp,
    model,
    usage: {
      input_tokens: usage.input_tokens ?? 0,
      output_tokens: usage.output_tokens ?? 0,
      cache_creation_input_tokens: usage.cache_creation_input_tokens ?? 0,
      cache_read_input_tokens: usage.cache_read_input_tokens ?? 0,
      cache_creation: usage.cache_creation,
      server_tool_use: usage.server_tool_use,
      service_tier: usage.service_tier ?? "",
      inference_geo: usage.inference_geo,
    },
    project,
    isSubagent,
    agentId: parsed.agentId,
  };
}

/**
 * Read and parse a single JSONL file from a given byte offset.
 * Returns parsed lines and the new byte offset.
 */
export async function readFile(
  filePath: string,
  project: string,
  isSubagent: boolean,
  byteOffset = 0,
): Promise<{ lines: ParsedLine[]; newOffset: number }> {
  let content: string;
  try {
    const buf = await fsReadFile(filePath);
    const slice = byteOffset > 0 ? buf.subarray(byteOffset) : buf;
    content = stripBom(slice.toString("utf-8"));
  } catch {
    return { lines: [], newOffset: byteOffset };
  }

  if (!content.trim()) return { lines: [], newOffset: byteOffset };

  const rawLines = content.split("\n");
  const lines: ParsedLine[] = [];

  for (const raw of rawLines) {
    const parsed = parseLine(raw, project, isSubagent);
    if (parsed) lines.push(parsed);
  }

  const newOffset =
    byteOffset + Buffer.byteLength(content, "utf-8") + (byteOffset > 0 ? 0 : 0);
  // Recalculate based on full file size for accuracy
  try {
    const fileStat = await stat(filePath);
    return { lines, newOffset: fileStat.size };
  } catch {
    return { lines, newOffset: byteOffset + Buffer.byteLength(content, "utf-8") };
  }
}

/**
 * Recursively find all .jsonl files under a directory, including subagent files.
 */
async function findJsonlFiles(
  dir: string,
): Promise<{ path: string; isSubagent: boolean }[]> {
  const results: { path: string; isSubagent: boolean }[] = [];

  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const subResults = await findJsonlFiles(fullPath);
      results.push(...subResults);
    } else if (entry.isFile() && entry.name.endsWith(".jsonl")) {
      const isSubagent = fullPath.includes(`${sep}subagents${sep}`);
      results.push({ path: fullPath, isSubagent });
    }
  }

  return results;
}

/**
 * Read all JSONL files under the data path.
 * dataPath defaults to ~/.claude/projects/
 */
export async function readAll(
  dataPath: string,
): Promise<ParsedLine[]> {
  const allLines: ParsedLine[] = [];

  let projectDirs;
  try {
    projectDirs = await readdir(dataPath, { withFileTypes: true });
  } catch {
    return allLines;
  }

  for (const projectDir of projectDirs) {
    if (!projectDir.isDirectory()) continue;

    const project = deriveProjectName(projectDir.name);
    const projectPath = join(dataPath, projectDir.name);
    const jsonlFiles = await findJsonlFiles(projectPath);

    for (const { path: filePath, isSubagent } of jsonlFiles) {
      const { lines } = await readFile(filePath, project, isSubagent);
      allLines.push(...lines);
    }
  }

  return allLines;
}

/**
 * Incremental read — only reads new bytes from files since last offsets.
 * Returns new lines and updated offsets.
 */
export async function readIncremental(
  dataPath: string,
  offsets: FileOffsets,
): Promise<{ lines: ParsedLine[]; offsets: FileOffsets }> {
  const newOffsets: FileOffsets = { ...offsets };
  const allLines: ParsedLine[] = [];

  let projectDirs;
  try {
    projectDirs = await readdir(dataPath, { withFileTypes: true });
  } catch {
    return { lines: allLines, offsets: newOffsets };
  }

  for (const projectDir of projectDirs) {
    if (!projectDir.isDirectory()) continue;

    const project = deriveProjectName(projectDir.name);
    const projectPath = join(dataPath, projectDir.name);
    const jsonlFiles = await findJsonlFiles(projectPath);

    for (const { path: filePath, isSubagent } of jsonlFiles) {
      const currentOffset = offsets[filePath] ?? 0;
      const { lines, newOffset } = await readFile(
        filePath,
        project,
        isSubagent,
        currentOffset,
      );
      allLines.push(...lines);
      newOffsets[filePath] = newOffset;
    }
  }

  return { lines: allLines, offsets: newOffsets };
}
