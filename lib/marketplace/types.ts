/**
 * marketplace/types.ts — Core types for the agents-cli marketplace.
 *
 * Products: harness, skill, plugin, hook-bundle, agent-def, agent-team.
 */

// ── Product Types ──────────────────────────────────────────────────────

export type ProductType = "harness" | "skill" | "plugin" | "hook-bundle" | "agent-def" | "agent-team" | "workflow";

export interface ProductPricing {
  model: "free" | "paid" | "freemium";
  price?: number;
  currency?: string;
}

export interface ProductStats {
  downloads: number;
  rating: number;
  reviews: number;
}

export type ProductStatus = "draft" | "published" | "archived";

export interface MarketplaceProduct {
  id: string;
  slug: string;
  productType: ProductType;
  name: string;
  description: string;
  author: string;
  version: string;
  pricing: ProductPricing;
  stats: ProductStats;
  compatibility: string;
  contents: string[];
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

// ── Versioning ─────────────────────────────────────────────────────────

export interface ProductVersion {
  version: string;
  changelog: string;
  publishedAt: string;
  downloadUrl: string;
  checksum: string;
}

// ── Reviews ────────────────────────────────────────────────────────────

export interface ProductReview {
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// ── Search ─────────────────────────────────────────────────────────────

export interface SearchFilters {
  productType?: ProductType;
  minRating?: number;
  status?: ProductStatus;
  author?: string;
  pricingModel?: ProductPricing["model"];
}
