import {
  readIncremental,
  type ParsedLine,
  type FileOffsets,
} from "@abacus/parser";
import { getConfig } from "./config";

const STALE_MS = 5_000;

interface CacheState {
  lines: ParsedLine[];
  offsets: FileOffsets;
  lastReadAt: number;
  reading: Promise<ParsedLine[]> | null;
}

const g = globalThis as typeof globalThis & { __abacusCache?: CacheState };
if (!g.__abacusCache) {
  g.__abacusCache = { lines: [], offsets: {}, lastReadAt: 0, reading: null };
}
const cache = g.__abacusCache;

async function refresh(): Promise<ParsedLine[]> {
  const { dataPath } = getConfig();

  const { lines, offsets: newOffsets } = await readIncremental(
    dataPath,
    cache.offsets,
  );
  if (lines.length > 0) {
    cache.lines = cache.lines.concat(lines);
  }
  cache.offsets = newOffsets;
  cache.lastReadAt = Date.now();
  return cache.lines;
}

export async function getCachedLines(): Promise<ParsedLine[]> {
  if (Date.now() - cache.lastReadAt < STALE_MS && cache.lines.length > 0) {
    return cache.lines;
  }

  // Deduplicate concurrent requests
  if (!cache.reading) {
    cache.reading = refresh().finally(() => {
      cache.reading = null;
    });
  }
  return cache.reading;
}
