// Pipeline intent classifier

import type { WorkflowIntent } from "../types.js";

export interface IntentResult {
  intent: WorkflowIntent;
  confidence: number;
  reasoning: string;
}

// Intent detection patterns
const INTENT_PATTERNS: Record<WorkflowIntent, {
  keywords: string[];
  patterns: RegExp[];
}> = {
  council: {
    keywords: ["council", "consensus", "multi-provider", "multiple providers", "voting", "fallback"],
    patterns: [
      /\b(council|consensus)\s+(of|for|workflow)/i,
      /multiple\s+(api|provider|service)s?\s+(for|with)/i,
      /(image|video|text)\s+generation\s+(through|via|using)\s+\w+\s+(and|,)\s*\w+/i,
    ],
  },
  publishing: {
    keywords: ["publish", "social", "post", "share", "facebook", "twitter", "linkedin", "tiktok", "instagram"],
    patterns: [
      /social\s+(network\s+)?publishing/i,
      /publish\s+(to\s+)?(multiple|all)\s+(platform|network)s/i,
      /(post|share)\s+(to|on)\s+(facebook|twitter|linkedin|tiktok|instagram)/i,
    ],
  },
  ecommerce: {
    keywords: ["store", "shop", "merch", "ecommerce", "e-commerce", "cart", "checkout", "stripe", "payment"],
    patterns: [
      /(merchandise|merch|online)\s+(store|shop|site)/i,
      /e-?commerce\s+(site|store|website|platform)/i,
      /(shopping|cart|checkout)\s+(cart|flow|workflow)/i,
    ],
  },
  assistant: {
    keywords: ["assistant", "ai assistant", "personal", "automation", "pipeline", "trigger", "event-driven"],
    patterns: [
      /personal\s+(ai\s+)?assistant/i,
      /ai\s+assistant\s+(like|for)/i,
      /(repo|repository)\s+(processing|indexing|embedding)/i,
    ],
  },
  "api-service": {
    keywords: ["api", "rest", "graphql", "backend", "server", "endpoint", "service"],
    patterns: [
      /api\s+(service|server|endpoint)/i,
      /(rest|graphql)\s+api/i,
      /backend\s+(service|api)/i,
    ],
  },
  custom: {
    keywords: [],
    patterns: [],
  },
};

/**
 * Classify workflow intent from a prompt.
 */
export function classifyIntent(prompt: string): IntentResult {
  const lowerPrompt = prompt.toLowerCase();
  const scores: Partial<Record<WorkflowIntent, number>> = {};

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    let score = 0;

    // Keyword matching
    for (const keyword of patterns.keywords) {
      if (lowerPrompt.includes(keyword)) {
        score += 0.15;
      }
    }

    // Pattern matching
    for (const pattern of patterns.patterns) {
      if (pattern.test(prompt)) {
        score += 0.3;
      }
    }

    scores[intent as WorkflowIntent] = Math.min(score, 1.0);
  }

  // Find best match
  let bestIntent: WorkflowIntent = "custom";
  let bestScore = 0;

  for (const intent of Object.keys(scores) as WorkflowIntent[]) {
    const score = scores[intent];
    if (score !== undefined && score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  return {
    intent: bestIntent,
    confidence: bestScore,
    reasoning: `Matched ${bestIntent} intent with ${Math.round(bestScore * 100)}% confidence`,
  };
}
