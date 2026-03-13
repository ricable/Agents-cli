/**
 * marketplace/store.ts — JSON index + filesystem storage for marketplace products.
 *
 * Stores products under ~/.agents-cli/marketplace/ with a central index.json.
 * Each product gets its own directory: <baseDir>/<productId>/
 */

import { mkdirSync, existsSync, readFileSync, writeFileSync, readdirSync, cpSync, renameSync } from "node:fs";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { searchProducts } from "./search.js";
import type {
  MarketplaceProduct,
  ProductType,
  ProductVersion,
  ProductReview,
  SearchFilters,
} from "./types.js";

// ── Index file structure ───────────────────────────────────────────────

interface MarketplaceIndex {
  version: 1;
  products: MarketplaceProduct[];
  updatedAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────

function atomicWriteJson(filePath: string, data: unknown): void {
  const tmpPath = filePath + ".tmp";
  writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf-8");
  renameSync(tmpPath, filePath);
}

// ── MarketplaceStore ───────────────────────────────────────────────────

export class MarketplaceStore {
  private readonly baseDir: string;
  private readonly indexPath: string;
  private index: MarketplaceIndex;

  constructor(baseDir: string) {
    this.baseDir = resolve(baseDir);
    this.indexPath = join(this.baseDir, "index.json");
    mkdirSync(this.baseDir, { recursive: true });
    this.index = this.loadIndex();
  }

  // ── Index management ───────────────────────────────────────────

  private loadIndex(): MarketplaceIndex {
    if (!existsSync(this.indexPath)) {
      return { version: 1, products: [], updatedAt: new Date().toISOString() };
    }
    try {
      const raw = readFileSync(this.indexPath, "utf-8");
      return JSON.parse(raw) as MarketplaceIndex;
    } catch {
      return { version: 1, products: [], updatedAt: new Date().toISOString() };
    }
  }

  private saveIndex(): void {
    this.index.updatedAt = new Date().toISOString();
    atomicWriteJson(this.indexPath, this.index);
  }

  // ── Public API ─────────────────────────────────────────────────

  /**
   * Publish a product. Copies content from contentDir into the store.
   * If product.id already exists, it is updated (new version).
   */
  async publish(product: MarketplaceProduct, contentDir: string): Promise<void> {
    if (!product.id) {
      throw new Error("Product must have an id");
    }
    if (!product.name || !product.productType) {
      throw new Error("Product must have name and productType");
    }

    const productDir = join(this.baseDir, product.id);
    mkdirSync(productDir, { recursive: true });

    // Copy content files
    if (existsSync(contentDir)) {
      cpSync(contentDir, productDir, { recursive: true });
    }

    // Update timestamp
    const now = new Date().toISOString();
    product.updatedAt = now;

    // Upsert in index
    const existing = this.index.products.findIndex(p => p.id === product.id);
    if (existing >= 0) {
      this.index.products[existing] = product;
    } else {
      product.createdAt = product.createdAt || now;
      this.index.products.push(product);
    }

    this.saveIndex();
  }

  /**
   * Search products by query string and optional filters.
   */
  async search(query: string, filters?: SearchFilters): Promise<MarketplaceProduct[]> {
    return searchProducts(this.index.products, query, filters);
  }

  /**
   * Get a single product by ID.
   */
  async getProduct(id: string): Promise<MarketplaceProduct | null> {
    return this.index.products.find(p => p.id === id) ?? null;
  }

  /**
   * List products with optional filtering and pagination.
   */
  async listProducts(opts?: {
    productType?: ProductType;
    limit?: number;
    offset?: number;
  }): Promise<MarketplaceProduct[]> {
    let results = this.index.products.filter(p => p.status === "published");

    if (opts?.productType) {
      results = results.filter(p => p.productType === opts.productType);
    }

    const offset = opts?.offset ?? 0;
    const limit = opts?.limit ?? 50;
    return results.slice(offset, offset + limit);
  }

  /**
   * Add a review for a product. Updates the product's stats.
   */
  async addReview(productId: string, review: ProductReview): Promise<void> {
    const product = this.index.products.find(p => p.id === productId);
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    if (review.rating < 1 || review.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Store review in product's directory
    const reviewsDir = join(this.baseDir, productId, "reviews");
    mkdirSync(reviewsDir, { recursive: true });

    const reviewId = randomUUID().slice(0, 8);
    const reviewPath = join(reviewsDir, `${reviewId}.json`);
    writeFileSync(reviewPath, JSON.stringify(review, null, 2), "utf-8");

    // Update stats: recalculate from all reviews
    const reviewFiles = readdirSync(reviewsDir).filter(f => f.endsWith(".json"));
    let totalRating = 0;
    let count = 0;
    for (const file of reviewFiles) {
      try {
        const r = JSON.parse(readFileSync(join(reviewsDir, file), "utf-8")) as ProductReview;
        totalRating += r.rating;
        count++;
      } catch {
        // skip corrupt review files
      }
    }

    product.stats.reviews = count;
    product.stats.rating = count > 0 ? Math.round((totalRating / count) * 10) / 10 : 0;
    product.updatedAt = new Date().toISOString();

    this.saveIndex();
  }

  /**
   * Get version history for a product.
   */
  async getVersions(productId: string): Promise<ProductVersion[]> {
    const versionsDir = join(this.baseDir, productId, "versions");
    if (!existsSync(versionsDir)) return [];

    const files = readdirSync(versionsDir).filter(f => f.endsWith(".json")).sort();
    const versions: ProductVersion[] = [];

    for (const file of files) {
      try {
        const raw = readFileSync(join(versionsDir, file), "utf-8");
        versions.push(JSON.parse(raw) as ProductVersion);
      } catch {
        // skip corrupt version files
      }
    }

    return versions;
  }

  /**
   * Record a new version for a product.
   */
  async addVersion(productId: string, version: ProductVersion): Promise<void> {
    const product = this.index.products.find(p => p.id === productId);
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    const versionsDir = join(this.baseDir, productId, "versions");
    mkdirSync(versionsDir, { recursive: true });

    const versionPath = join(versionsDir, `${version.version}.json`);
    writeFileSync(versionPath, JSON.stringify(version, null, 2), "utf-8");

    // Update product version
    product.version = version.version;
    product.updatedAt = new Date().toISOString();
    this.saveIndex();
  }

  /**
   * Get product content directory path.
   */
  getProductDir(productId: string): string {
    return join(this.baseDir, productId);
  }

  /**
   * Get total product count.
   */
  getProductCount(): number {
    return this.index.products.length;
  }
}
