// Pipeline entity extractor

import type { ExtractedEntity } from "../types.js";

export interface EntityMapping {
  domain: string;
  npm?: string;
  github?: string;
  crates?: string;
  type: "api" | "service" | "library" | "platform";
}

// Known API/service registry
export const KNOWN_ENTITIES: Record<string, EntityMapping> = {
  // Image Generation
  "banana": { domain: "image-gen", npm: "@banana-sdk/client", github: "banana-sdk/banana-node", type: "api" },
  "openai": { domain: "ai-sdk", npm: "openai", github: "openai/openai-node", type: "api" },
  "flux": { domain: "image-gen", npm: "@fal-ai/flux", github: "fal-ai/fal-js", type: "api" },
  "midjourney": { domain: "image-gen", github: "midjourney-community/midjourney-api", type: "api" },
  "stability": { domain: "image-gen", npm: "stability-sdk", github: "Stability-AI/stability-node", type: "api" },
  "dalle": { domain: "image-gen", npm: "openai", type: "api" },
  "dall-e": { domain: "image-gen", npm: "openai", type: "api" },

  // Payments
  "stripe": { domain: "payments", npm: "stripe", github: "stripe/stripe-node", type: "api" },
  "paypal": { domain: "payments", npm: "@paypal/checkout-server-sdk", type: "api" },
  "lemon-squeezy": { domain: "payments", npm: "@lemonsqueezy/lemonsqueezy.js", type: "api" },
  "lemonsqueezy": { domain: "payments", npm: "@lemonsqueezy/lemonsqueezy.js", type: "api" },

  // Social Networks
  "facebook": { domain: "social", npm: "facebook-nodejs-business-sdk", type: "api" },
  "tiktok": { domain: "social", npm: "tiktok-api", type: "api" },
  "instagram": { domain: "social", npm: "instagram-graph-api", type: "api" },
  "linkedin": { domain: "social", npm: "linkedin-api", type: "api" },
  "twitter": { domain: "social", npm: "twitter-api-v2", github: "PLhery/node-twitter-api-v2", type: "api" },
  "x": { domain: "social", npm: "twitter-api-v2", github: "PLhery/node-twitter-api-v2", type: "api" },
  "youtube": { domain: "social", npm: "googleapis", github: "googleapis/google-api-nodejs-client", type: "api" },
  "pinterest": { domain: "social", npm: "pinterest-api", type: "api" },
  "threads": { domain: "social", github: "threads-api/threads-api", type: "api" },

  // Video
  "ffmpeg": { domain: "video", npm: "fluent-ffmpeg", type: "library" },
  "remotion": { domain: "video", npm: "@remotion/player", github: "remotion-dev/remotion", type: "library" },

  // AI/LLM
  "anthropic": { domain: "ai-sdk", npm: "@anthropic-ai/sdk", github: "anthropics/anthropic-sdk-typescript", type: "api" },
  "claude": { domain: "ai-sdk", npm: "@anthropic-ai/sdk", type: "api" },
  "gemini": { domain: "ai-sdk", npm: "@google/generative-ai", type: "api" },
  "ollama": { domain: "ai-sdk", npm: "ollama", github: "ollama/ollama-js", type: "api" },

  // Frontend
  "next": { domain: "web", npm: "next", github: "vercel/next.js", type: "library" },
  "nextjs": { domain: "web", npm: "next", github: "vercel/next.js", type: "library" },
  "react": { domain: "ui", npm: "react", github: "facebook/react", type: "library" },
  "tailwind": { domain: "ui", npm: "tailwindcss", github: "tailwindlabs/tailwindcss", type: "library" },
  "vue": { domain: "ui", npm: "vue", github: "vuejs/vue", type: "library" },
  "svelte": { domain: "ui", npm: "svelte", github: "sveltejs/svelte", type: "library" },

  // Backend
  "hono": { domain: "web", npm: "hono", github: "honojs/hono", type: "library" },
  "elysia": { domain: "web", npm: "elysia", github: "elysiajs/elysia", type: "library" },
  "trpc": { domain: "web", npm: "@trpc/server", github: "trpc-group/trpc", type: "library" },
  "express": { domain: "web", npm: "express", github: "expressjs/express", type: "library" },
  "fastify": { domain: "web", npm: "fastify", github: "fastify/fastify", type: "library" },

  // Database
  "prisma": { domain: "database", npm: "prisma", github: "prisma/prisma", type: "library" },
  "drizzle": { domain: "database", npm: "drizzle-orm", github: "drizzle-team/drizzle-orm", type: "library" },

  // Auth
  "clerk": { domain: "auth", npm: "@clerk/nextjs", github: "clerkinc/clerk-sdk-node", type: "service" },
  "nextauth": { domain: "auth", npm: "next-auth", github: "nextauthjs/next-auth", type: "library" },
  "auth0": { domain: "auth", npm: "@auth0/nextjs-auth0", type: "service" },
};

/**
 * Extract known entities from a prompt.
 */
export function extractEntities(prompt: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];

  for (const [keyword, mapping] of Object.entries(KNOWN_ENTITIES)) {
    // Check for whole word match or hyphenated match
    const regex = new RegExp(`\\b${keyword.replace("-", "\\s*-\\s*")}\\b`, "i");
    if (regex.test(prompt)) {
      const entity: ExtractedEntity = {
        name: keyword.charAt(0).toUpperCase() + keyword.slice(1),
        type: mapping.type,
        source: mapping.github ? "github" : mapping.npm ? "npm" : "github",
        domain: mapping.domain,
        confidence: 0.95, // High confidence for exact matches
      };

      if (mapping.npm) entity.packageName = mapping.npm;
      if (mapping.github) entity.repoSlug = mapping.github;

      entities.push(entity);
    }
  }

  return entities;
}
