/**
 * hooks/templates/index.ts — Template registry mapping domains to hook configurations.
 *
 * Maps 52+ domains to domain-specific hook configurations. Each template
 * defines PreToolUse block patterns, PostToolUse validations, Stop quality gates,
 * SessionStart context injections, and Notification triggers.
 */

import type { DomainHookConfig } from "../types.js";
import { DATABASE_HOOKS } from "./database.js";
import { SECURITY_HOOKS } from "./security.js";
import { PYTHON_HOOKS } from "./python.js";
import { JAVASCRIPT_HOOKS } from "./javascript.js";
import { DEVOPS_HOOKS } from "./devops.js";
import { GIT_HOOKS } from "./git.js";
import { CLOUD_HOOKS } from "./cloud.js";
import { TESTING_HOOKS } from "./testing.js";
import { DEFAULT_HOOKS } from "./default.js";

// ── Domain → hook config registry ──────────────────────────────────────

const DOMAIN_HOOK_REGISTRY: Record<string, DomainHookConfig> = {
  // Direct domain matches
  "database": DATABASE_HOOKS,
  "security": SECURITY_HOOKS,
  "python": PYTHON_HOOKS,
  "javascript": JAVASCRIPT_HOOKS,
  "devops": DEVOPS_HOOKS,
  "git": GIT_HOOKS,
  "cloud": CLOUD_HOOKS,
  "testing": TESTING_HOOKS,

  // AI/ML domains → default + context injections
  "ai-ml": DEFAULT_HOOKS,
  "agent": DEFAULT_HOOKS,
  "ml": DEFAULT_HOOKS,
  "vector": DEFAULT_HOOKS,

  // Infrastructure domains → devops hooks
  "infra": DEVOPS_HOOKS,
  "monitoring": DEVOPS_HOOKS,

  // Web domains → javascript hooks
  "web": JAVASCRIPT_HOOKS,
  "ui": JAVASCRIPT_HOOKS,
  "build": JAVASCRIPT_HOOKS,

  // Data domains → database hooks
  "queue": DATABASE_HOOKS,
  "messaging": DATABASE_HOOKS,

  // Auth/validation → security hooks
  "auth": SECURITY_HOOKS,
  "validation": SECURITY_HOOKS,

  // Other
  "runtime": JAVASCRIPT_HOOKS,
  "state": JAVASCRIPT_HOOKS,
  "wasm": DEFAULT_HOOKS,
  "observability": DEVOPS_HOOKS,
  "documentation": DEFAULT_HOOKS,
  "file-processing": DEFAULT_HOOKS,
  "http-api": JAVASCRIPT_HOOKS,
  "network": SECURITY_HOOKS,
  "code-search": DEFAULT_HOOKS,
};

/**
 * Get the hook configuration for a domain.
 * Falls back to DEFAULT_HOOKS for unknown domains.
 * Handles compound domains like "ai-ml/llm-inference" by checking base domain.
 */
export function getHookConfig(domain: string): DomainHookConfig {
  // Try exact match first
  const exact = DOMAIN_HOOK_REGISTRY[domain];
  if (exact) return { ...exact, domain };

  // Try base domain (before /)
  const base = domain.split("/")[0]!;
  const baseConfig = DOMAIN_HOOK_REGISTRY[base];
  if (baseConfig) return { ...baseConfig, domain };

  // Fallback
  return { ...DEFAULT_HOOKS, domain };
}

/**
 * Get all registered domain hook configs.
 */
export function getAllHookConfigs(): Record<string, DomainHookConfig> {
  return { ...DOMAIN_HOOK_REGISTRY };
}
