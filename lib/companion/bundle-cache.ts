/**
 * companion/bundle-cache.ts — Content-addressed bundle cache.
 *
 * Cache key: SHA256 of sorted tool sources + tier.
 * Avoids regenerating identical bundles for the same tool set.
 */

import { createHash } from "node:crypto";
import { existsSync, statSync, mkdirSync, unlinkSync, readdirSync } from "node:fs";
import { join } from "node:path";

const TIER_TTL_MS: Record<string, number> = {
  free: 0,                          // no caching
  starter: 3_600_000,               // 1 hour
  pro: 86_400_000,                  // 24 hours
  enterprise: 604_800_000,          // 7 days
};

/**
 * Generate a cache key from tool sources and tier.
 */
export function bundleCacheKey(sources: string[], tier: string): string {
  const sorted = [...sources].sort().join("|");
  return createHash("sha256").update(`${tier}:${sorted}`).digest("hex");
}

/**
 * Content-addressed bundle cache.
 */
export class BundleCache {
  private readonly cacheDir: string;

  constructor(outputDir: string) {
    this.cacheDir = join(outputDir, "cache");
    mkdirSync(this.cacheDir, { recursive: true });
  }

  /**
   * Get cached bundle path if valid, null otherwise.
   */
  get(sources: string[], tier: string): string | null {
    const ttl = TIER_TTL_MS[tier] ?? 0;
    if (ttl === 0) return null;

    const key = bundleCacheKey(sources, tier);
    const cachePath = join(this.cacheDir, `${key}.tar.gz`);

    if (!existsSync(cachePath)) return null;

    try {
      const stat = statSync(cachePath);
      const age = Date.now() - stat.mtimeMs;
      if (age > ttl) {
        try { unlinkSync(cachePath); } catch { /* ignore */ }
        return null;
      }
      return cachePath;
    } catch {
      return null;
    }
  }

  /**
   * Get the path where a bundle should be written for caching.
   */
  pathFor(sources: string[], tier: string): string {
    const key = bundleCacheKey(sources, tier);
    return join(this.cacheDir, `${key}.tar.gz`);
  }

  /**
   * Sweep expired entries.
   */
  sweep(): void {
    if (!existsSync(this.cacheDir)) return;

    const now = Date.now();
    const maxTtl = Math.max(...Object.values(TIER_TTL_MS));

    for (const file of readdirSync(this.cacheDir)) {
      if (!file.endsWith(".tar.gz")) continue;
      const filePath = join(this.cacheDir, file);
      try {
        const stat = statSync(filePath);
        if (now - stat.mtimeMs > maxTtl) {
          unlinkSync(filePath);
        }
      } catch { /* ignore */ }
    }
  }
}
