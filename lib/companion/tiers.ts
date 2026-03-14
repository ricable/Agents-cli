/**
 * companion/tiers.ts — Tier configuration and filtering for the SaaS pipeline.
 *
 * Includes base TierLimits (backward-compat) and extended TierConfig with
 * per-product-type entitlements for the marketplace.
 */

import type { ProductType } from "../marketplace/types.js";

// ── Base tier limits (backward-compatible) ─────────────────────────────

export interface TierLimits {
  readonly maxTools: number;
  readonly deep: boolean;
  readonly full: boolean;
  readonly ai: boolean;
  readonly workflows: boolean;
  readonly dailyGens: number;   // -1 = unlimited
}

export const TIER_LIMITS: Record<string, TierLimits> = {
  free:       { maxTools: 5,   deep: false, full: false, ai: false, workflows: false, dailyGens: 3 },
  starter:    { maxTools: 15,  deep: false, full: false, ai: false, workflows: true,  dailyGens: 20 },
  pro:        { maxTools: 50,  deep: true,  full: true,  ai: true,  workflows: true,  dailyGens: 100 },
  enterprise: { maxTools: 200, deep: true,  full: true,  ai: true,  workflows: true,  dailyGens: -1 },
};

/**
 * Get tier limits, defaulting to "free" for unknown tiers.
 */
export function getTierLimits(tier: string): TierLimits {
  return TIER_LIMITS[tier] ?? TIER_LIMITS["free"]!;
}

// ── Product entitlements ───────────────────────────────────────────────

export interface ProductEntitlement {
  readonly enabled: boolean;
  readonly dailyLimit: number;   // -1 = unlimited
  readonly maxPerMonth: number;  // -1 = unlimited
  readonly canPublish: boolean;
  readonly canBundle: boolean;
}

export interface TierConfig {
  readonly limits: TierLimits;
  readonly products: Record<ProductType, ProductEntitlement>;
}

// ── Default product entitlements per tier ───────────────────────────────

function entitlement(
  enabled: boolean,
  dailyLimit: number,
  maxPerMonth: number,
  canPublish: boolean,
  canBundle: boolean,
): ProductEntitlement {
  return { enabled, dailyLimit, maxPerMonth, canPublish, canBundle };
}

const FREE_PRODUCTS: Record<ProductType, ProductEntitlement> = {
  harness:      entitlement(true,   3,   10,  false, false),
  skill:        entitlement(true,   5,   20,  false, false),
  plugin:       entitlement(false,  0,    0,  false, false),
  "hook-bundle":  entitlement(false,  0,    0,  false, false),
  "agent-def":    entitlement(false,  0,    0,  false, false),
  "agent-team":   entitlement(false,  0,    0,  false, false),
  workflow:     entitlement(true,   0,    0,  false, false),
};

const STARTER_PRODUCTS: Record<ProductType, ProductEntitlement> = {
  harness:      entitlement(true,  15,   50,  false, false),
  skill:        entitlement(true,  20,  100,  true,  false),
  plugin:       entitlement(true,   5,   20,  true,  false),
  "hook-bundle":  entitlement(true,   3,   10,  false, false),
  "agent-def":    entitlement(true,   5,   20,  false, false),
  "agent-team":   entitlement(false,  0,    0,  false, false),
  workflow:     entitlement(true,   2,    5,  false, false),
};

const PRO_PRODUCTS: Record<ProductType, ProductEntitlement> = {
  harness:      entitlement(true,  50,  200,  true,  true),
  skill:        entitlement(true, 100,  500,  true,  true),
  plugin:       entitlement(true,  30,  150,  true,  true),
  "hook-bundle":  entitlement(true,  20,  100,  true,  true),
  "agent-def":    entitlement(true,  30,  150,  true,  true),
  "agent-team":   entitlement(true,  10,   50,  true,  true),
  workflow:     entitlement(true,  -1,   -1,  true,  true),
};

const ENTERPRISE_PRODUCTS: Record<ProductType, ProductEntitlement> = {
  harness:      entitlement(true,  -1,   -1,  true,  true),
  skill:        entitlement(true,  -1,   -1,  true,  true),
  plugin:       entitlement(true,  -1,   -1,  true,  true),
  "hook-bundle":  entitlement(true,  -1,   -1,  true,  true),
  "agent-def":    entitlement(true,  -1,   -1,  true,  true),
  "agent-team":   entitlement(true,  -1,   -1,  true,  true),
  workflow:     entitlement(true,  -1,   -1,  true,  true),
};

// ── Full tier config map ───────────────────────────────────────────────

export const TIER_CONFIG: Record<string, TierConfig> = {
  free: {
    limits: TIER_LIMITS["free"]!,
    products: FREE_PRODUCTS,
  },
  starter: {
    limits: TIER_LIMITS["starter"]!,
    products: STARTER_PRODUCTS,
  },
  pro: {
    limits: TIER_LIMITS["pro"]!,
    products: PRO_PRODUCTS,
  },
  enterprise: {
    limits: TIER_LIMITS["enterprise"]!,
    products: ENTERPRISE_PRODUCTS,
  },
};

/**
 * Get full tier config including product entitlements.
 * Defaults to "free" for unknown tiers.
 */
export function getTierConfig(tier: string): TierConfig {
  return TIER_CONFIG[tier] ?? TIER_CONFIG["free"]!;
}

/**
 * Get product entitlement for a specific tier and product type.
 */
export function getProductEntitlement(tier: string, productType: ProductType): ProductEntitlement {
  const config = getTierConfig(tier);
  return config.products[productType];
}
