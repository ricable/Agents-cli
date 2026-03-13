/**
 * marketplace/search.ts — Simple FTS search on marketplace products.
 *
 * Text matching on name + description + contents with relevance scoring.
 * No external dependencies — pure in-memory search.
 */

import type { MarketplaceProduct, SearchFilters } from "./types.js";

// ── Scoring weights ────────────────────────────────────────────────────

const WEIGHT_NAME = 3.0;
const WEIGHT_DESCRIPTION = 2.0;
const WEIGHT_CONTENTS = 1.0;
const WEIGHT_AUTHOR = 0.5;

// ── Tokenizer ──────────────────────────────────────────────────────────

/**
 * Tokenize a string into lowercase terms, splitting on non-alphanumeric chars.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(t => t.length > 1);
}

/**
 * Compute term frequency map for a token list.
 */
function termFrequency(tokens: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const token of tokens) {
    freq.set(token, (freq.get(token) ?? 0) + 1);
  }
  return freq;
}

// ── Scoring ────────────────────────────────────────────────────────────

/**
 * Score a product against query terms. Higher = more relevant.
 */
function scoreProduct(product: MarketplaceProduct, queryTerms: string[]): number {
  if (queryTerms.length === 0) return 0;

  const nameTokens = tokenize(product.name);
  const descTokens = tokenize(product.description);
  const contentsTokens = product.contents.flatMap(c => tokenize(c));
  const authorTokens = tokenize(product.author);

  const nameTf = termFrequency(nameTokens);
  const descTf = termFrequency(descTokens);
  const contentsTf = termFrequency(contentsTokens);
  const authorTf = termFrequency(authorTokens);

  let score = 0;
  let matchedTerms = 0;

  for (const term of queryTerms) {
    let termScore = 0;

    // Exact match in name (highest weight)
    if (nameTf.has(term)) {
      termScore += (nameTf.get(term)! / Math.max(nameTokens.length, 1)) * WEIGHT_NAME;
    }

    // Prefix match in name
    for (const [nameToken] of nameTf) {
      if (nameToken.startsWith(term) && nameToken !== term) {
        termScore += 0.5 * WEIGHT_NAME;
        break;
      }
    }

    // Match in description
    if (descTf.has(term)) {
      termScore += (descTf.get(term)! / Math.max(descTokens.length, 1)) * WEIGHT_DESCRIPTION;
    }

    // Match in contents
    if (contentsTf.has(term)) {
      termScore += (contentsTf.get(term)! / Math.max(contentsTokens.length, 1)) * WEIGHT_CONTENTS;
    }

    // Match in author
    if (authorTf.has(term)) {
      termScore += WEIGHT_AUTHOR;
    }

    if (termScore > 0) matchedTerms++;
    score += termScore;
  }

  // Bonus for matching all query terms
  if (matchedTerms === queryTerms.length && queryTerms.length > 1) {
    score *= 1.5;
  }

  // Boost published products
  if (product.status === "published") {
    score *= 1.1;
  }

  // Small boost from rating
  if (product.stats.rating > 0) {
    score *= 1 + (product.stats.rating / 50); // max 10% boost at 5.0 rating
  }

  return score;
}

// ── Main search function ───────────────────────────────────────────────

/**
 * Search products with text matching and optional filters.
 * Returns results sorted by relevance score (descending).
 */
export function searchProducts(
  products: MarketplaceProduct[],
  query: string,
  filters?: SearchFilters,
): MarketplaceProduct[] {
  const queryTerms = tokenize(query);

  // Apply filters first
  let filtered = products;

  if (filters?.productType) {
    filtered = filtered.filter(p => p.productType === filters.productType);
  }

  if (filters?.minRating !== undefined) {
    filtered = filtered.filter(p => p.stats.rating >= filters.minRating!);
  }

  if (filters?.status) {
    filtered = filtered.filter(p => p.status === filters.status);
  }

  if (filters?.author) {
    const authorLower = filters.author.toLowerCase();
    filtered = filtered.filter(p => p.author.toLowerCase() === authorLower);
  }

  if (filters?.pricingModel) {
    filtered = filtered.filter(p => p.pricing.model === filters.pricingModel);
  }

  // If no query, return filtered list sorted by downloads
  if (queryTerms.length === 0) {
    return [...filtered].sort((a, b) => b.stats.downloads - a.stats.downloads);
  }

  // Score and sort
  const scored = filtered
    .map(p => ({ product: p, score: scoreProduct(p, queryTerms) }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map(s => s.product);
}
