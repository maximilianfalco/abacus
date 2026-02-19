import { mkdtemp, mkdir, writeFile, appendFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

function makeLine(sessionId: string, model: string, inputTokens: number) {
  return JSON.stringify({
    parentUuid: "p1",
    isSidechain: false,
    userType: "human",
    cwd: "/tmp",
    sessionId,
    version: "1.0.0",
    gitBranch: "main",
    type: "assistant",
    message: {
      model,
      usage: {
        input_tokens: inputTokens,
        output_tokens: 50,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
        service_tier: "default",
      },
    },
    uuid: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  });
}

let tmpDir: string;
let projectDir: string;

async function setupTmpData(lines: string[]) {
  tmpDir = await mkdtemp(join(tmpdir(), "abacus-cache-test-"));
  projectDir = join(tmpDir, "-Users-test-Desktop-Code-myproject");
  await mkdir(projectDir, { recursive: true });
  await writeFile(join(projectDir, "session.jsonl"), lines.join("\n") + "\n");
  return tmpDir;
}

function resetCache() {
  const g = globalThis as typeof globalThis & { __abacusCache?: unknown };
  delete g.__abacusCache;
}

afterAll(async () => {
  if (tmpDir) await rm(tmpDir, { recursive: true, force: true });
});

describe("getCachedLines", () => {
  beforeEach(() => {
    resetCache();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("reads lines from JSONL files on first call", async () => {
    const dataPath = await setupTmpData([
      makeLine("s1", "claude-sonnet-4-20250514", 100),
      makeLine("s1", "claude-sonnet-4-20250514", 200),
    ]);

    vi.stubEnv("CLAUDE_DATA_PATH", dataPath);
    const { getCachedLines } = await import("@/app/lib/cache");

    const lines = await getCachedLines();
    expect(lines).toHaveLength(2);
    expect(lines[0].model).toBe("claude-sonnet-4-20250514");
    expect(lines[0].usage.input_tokens).toBe(100);
    expect(lines[1].usage.input_tokens).toBe(200);
  });

  it("returns cached data on second call within staleness window", async () => {
    const dataPath = await setupTmpData([
      makeLine("s1", "claude-sonnet-4-20250514", 100),
    ]);

    vi.stubEnv("CLAUDE_DATA_PATH", dataPath);
    const { getCachedLines } = await import("@/app/lib/cache");

    const first = await getCachedLines();
    expect(first).toHaveLength(1);

    // Append new data to the file — should NOT be picked up
    await appendFile(
      join(projectDir, "session.jsonl"),
      makeLine("s2", "claude-sonnet-4-20250514", 999) + "\n",
    );

    const second = await getCachedLines();
    expect(second).toHaveLength(1);
    expect(second).toBe(first); // same reference = cache hit
  });

  it("reads new data after staleness expires", async () => {
    const dataPath = await setupTmpData([
      makeLine("s1", "claude-sonnet-4-20250514", 100),
    ]);

    vi.stubEnv("CLAUDE_DATA_PATH", dataPath);
    const { getCachedLines } = await import("@/app/lib/cache");

    const first = await getCachedLines();
    expect(first).toHaveLength(1);

    // Append new data
    await appendFile(
      join(projectDir, "session.jsonl"),
      makeLine("s2", "claude-sonnet-4-20250514", 999) + "\n",
    );

    // Force cache to be stale by manipulating lastReadAt
    const g = globalThis as typeof globalThis & {
      __abacusCache?: { lastReadAt: number };
    };
    g.__abacusCache!.lastReadAt = 0;

    const second = await getCachedLines();
    expect(second).toHaveLength(2);
    expect(second[1].usage.input_tokens).toBe(999);
  });

  it("deduplicates concurrent requests", async () => {
    const dataPath = await setupTmpData([
      makeLine("s1", "claude-sonnet-4-20250514", 100),
      makeLine("s1", "claude-sonnet-4-20250514", 200),
      makeLine("s1", "claude-sonnet-4-20250514", 300),
    ]);

    vi.stubEnv("CLAUDE_DATA_PATH", dataPath);
    const { getCachedLines } = await import("@/app/lib/cache");

    // Fire 3 concurrent calls — only 1 disk read should happen
    const [a, b, c] = await Promise.all([
      getCachedLines(),
      getCachedLines(),
      getCachedLines(),
    ]);

    expect(a).toBe(b);
    expect(b).toBe(c);
    expect(a).toHaveLength(3);
  });

  it("derives project name from directory", async () => {
    const dataPath = await setupTmpData([
      makeLine("s1", "claude-sonnet-4-20250514", 100),
    ]);

    vi.stubEnv("CLAUDE_DATA_PATH", dataPath);
    const { getCachedLines } = await import("@/app/lib/cache");

    const lines = await getCachedLines();
    expect(lines[0].project).toBe("myproject");
  });
});
