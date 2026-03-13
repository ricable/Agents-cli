/**
 * marketplace/pricing.ts — Pricing tiers and revenue split logic.
 *
 * Defines default pricing for each product type and computes
 * creator/platform revenue splits.
 */

// ── Types ──────────────────────────────────────────────────────────────

export interface PricingTier {
  productType: string;
  model: "free" | "paid" | "freemium";
  basePrice: number;
  currency: string;
  revenueSplit: { creator: number; platform: number };
}

// ── Default Pricing ────────────────────────────────────────────────────

export const DEFAULT_PRICING: Record<string, PricingTier> = {
  harness: {
    productType: "harness",
    model: "freemium",
    basePrice: 0,
    currency: "USD",
    revenueSplit: { creator: 80, platform: 20 },
  },
  skill: {
    productType: "skill",
    model: "free",
    basePrice: 0,
    currency: "USD",
    revenueSplit: { creator: 80, platform: 20 },
  },
  plugin: {
    productType: "plugin",
    model: "paid",
    basePrice: 4.99,
    currency: "USD",
    revenueSplit: { creator: 80, platform: 20 },
  },
  "hook-bundle": {
    productType: "hook-bundle",
    model: "paid",
    basePrice: 2.99,
    currency: "USD",
    revenueSplit: { creator: 80, platform: 20 },
  },
  "agent-def": {
    productType: "agent-def",
    model: "paid",
    basePrice: 3.99,
    currency: "USD",
    revenueSplit: { creator: 80, platform: 20 },
  },
  "agent-team": {
    productType: "agent-team",
    model: "paid",
    basePrice: 9.99,
    currency: "USD",
    revenueSplit: { creator: 80, platform: 20 },
  },
};

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Calculate the payout amounts for creator and platform from a sale price.
 *
 * @param price   Sale price (e.g. 4.99)
 * @param split   Revenue split percentages (must sum to 100)
 * @returns       Creator and platform amounts rounded to 2 decimal places
 */
export function calculatePayout(
  price: number,
  split: { creator: number; platform: number },
): { creatorAmount: number; platformAmount: number } {
  const creatorAmount = Math.round(price * (split.creator / 100) * 100) / 100;
  const platformAmount = Math.round(price * (split.platform / 100) * 100) / 100;
  return { creatorAmount, platformAmount };
}

/**
 * Suggest a price based on product type and complexity metrics.
 *
 * Heuristic:
 * - Base price from DEFAULT_PRICING for the product type
 * - +$1 per 10 commands (capped at +$5)
 * - +$0.50 per 10 tests (capped at +$2.50)
 * - Free products always return 0
 *
 * @param productType  Product type key (e.g. "plugin", "agent-def")
 * @param commandCount Number of CLI commands in the harness
 * @param testCount    Number of tests in the test suite
 * @returns            Suggested price in USD, rounded to 2 decimals
 */
export function getSuggestedPrice(
  productType: string,
  commandCount: number,
  testCount: number,
): number {
  const tier = DEFAULT_PRICING[productType];
  if (!tier || tier.model === "free") return 0;

  const base = tier.basePrice;
  const cmdBonus = Math.min(Math.floor(commandCount / 10), 5);
  const testBonus = Math.min(Math.floor(testCount / 10) * 0.5, 2.5);

  return Math.round((base + cmdBonus + testBonus) * 100) / 100;
}
