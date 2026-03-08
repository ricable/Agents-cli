/**
 * Prompt parser - converts natural language to structured capabilities.
 */

import type { Capability, ParsedPrompt, ProjectType } from "../types.js";

// Keywords that map to capabilities
const CAPABILITY_KEYWORDS: Record<string, Capability[]> = {
  // Image generation
  "image": ["image-generation"],
  "image generation": ["image-generation"],
  "dall-e": ["image-generation"],
  "dalle": ["image-generation"],
  "stable diffusion": ["image-generation"],
  "flux": ["image-generation"],
  "midjourney": ["image-generation"],

  // Video generation
  "video": ["video-generation"],
  "video generation": ["video-generation"],
  "runway": ["video-generation"],
  "pika": ["video-generation"],

  // Audio
  "audio": ["audio-generation"],
  "tts": ["audio-generation"],
  "speech": ["audio-generation"],
  "elevenlabs": ["audio-generation"],

  // Social platforms
  "facebook": ["social-facebook"],
  "tiktok": ["social-tiktok"],
  "instagram": ["social-instagram"],
  "linkedin": ["social-linkedin"],
  "twitter": ["social-twitter"],
  "x.com": ["social-twitter"],
  "youtube": ["social-youtube"],

  // Payments
  "stripe": ["payments-stripe"],
  "paypal": ["payments-paypal"],
  "payment": ["payments-stripe"],

  // LLMs
  "openai": ["llm-openai", "agent"],
  "gpt": ["llm-openai"],
  "chatgpt": ["llm-openai"],
  "anthropic": ["llm-anthropic"],
  "claude": ["llm-anthropic"],
  "google": ["llm-google"],
  "gemini": ["llm-google"],
  "ollama": ["llm-local"],
  "local": ["llm-local"],
  "bedrock": ["llm-aws-bedrock"],
  "aws": ["llm-aws-bedrock"],

  // Vector & embedding
  "vector": ["vector-storage", "embedding"],
  "embedding": ["embedding"],
  "qdrant": ["vector-storage"],
  "weaviate": ["vector-storage"],
  "milvus": ["vector-storage"],

  // RAG
  "rag": ["rag", "embedding"],
  "retrieval": ["rag"],
  "augmented generation": ["rag"],

  // MCP
  "mcp": ["mcp"],
  "model context protocol": ["mcp"],

  // Agent
  "agent": ["agent", "mcp"],
  "autonomous": ["agent"],
  "ai agent": ["agent"],

  // Browser automation
  "browser": ["browser-automation"],
  "puppeteer": ["browser-automation"],
  "playwright": ["browser-automation"],

  // Email
  "email": ["email"],
  "mail": ["email"],

  // Database
  "database": ["database"],
  "db": ["database"],
  "prisma": ["database"],
  "drizzle": ["database"],

  // Storage
  "storage": ["storage"],
  "s3": ["storage"],

  // WebSocket
  "websocket": ["websocket"],
  "socket": ["websocket"],
  "socket.io": ["websocket"],

  // API
  "api": ["api-gateway"],
  "rest": ["api-gateway"],
  "server": ["api-gateway"],

  // Auth
  "auth": ["authentication"],
  "authentication": ["authentication"],
  "login": ["authentication"],
  "nextauth": ["authentication"],
  "clerk": ["authentication"],
};

// Keywords that map to project types
const PROJECT_TYPE_KEYWORDS: Record<string, ProjectType> = {
  "workflow": "agent-workflow",
  "agent workflow": "agent-workflow",
  "automation workflow": "agent-workflow",
  "website": "website",
  "web app": "website",
  "store": "merch-store",
  "shop": "merch-store",
  "ecommerce": "merch-store",
  "merch": "merch-store",
  "assistant": "ai-assistant",
  "chatbot": "ai-assistant",
  "chat bot": "ai-assistant",
  "indexer": "repo-indexer",
  "search": "repo-indexer",
  "api": "api-service",
  "backend": "api-service",
};

// Keywords that map to tech stack
const TECH_KEYWORDS: Record<string, { language: string; framework?: string }> = {
  "next.js": { language: "javascript", framework: "next" },
  "nextjs": { language: "javascript", framework: "next" },
  "react": { language: "javascript", framework: "react" },
  "vue": { language: "javascript", framework: "vue" },
  "svelte": { language: "javascript", framework: "svelte" },
  "node": { language: "javascript" },
  "node.js": { language: "javascript" },
  "typescript": { language: "typescript" },
  "python": { language: "python" },
  "rust": { language: "rust" },
  "go": { language: "go" },
  "golang": { language: "go" },
  "java": { language: "java" },
  "kotlin": { language: "kotlin" },
  "swift": { language: "swift" },
};

const STOP_WORDS = new Set([
  "a", "an", "the", "with", "for", "in", "of", "and", "or", "to", "from", "using",
  "about", "that", "this", "is", "are", "was", "be", "as", "by", "write", "make",
  "build", "create", "generate", "use", "run", "get", "set", "do", "my", "i",
]);

/**
 * Parse a natural language prompt into structured capabilities.
 */
export function parsePrompt(prompt: string): ParsedPrompt {
  const lowerPrompt = prompt.toLowerCase();

  // Extract capabilities
  const capabilities = new Set<Capability>();
  for (const [keyword, caps] of Object.entries(CAPABILITY_KEYWORDS)) {
    if (lowerPrompt.includes(keyword)) {
      caps.forEach(c => capabilities.add(c));
    }
  }

  // Extract project type
  let projectType: ProjectType | null = null;
  for (const [keyword, type] of Object.entries(PROJECT_TYPE_KEYWORDS)) {
    if (lowerPrompt.includes(keyword)) {
      projectType = type;
      break;
    }
  }

  // If no explicit project type, infer from capabilities
  if (!projectType) {
    if (capabilities.has("payments-stripe") || capabilities.has("payments-paypal")) {
      projectType = "merch-store";
    } else if (capabilities.has("agent") || capabilities.size > 2) {
      projectType = "agent-workflow";
    } else if (capabilities.has("llm-openai") || capabilities.has("llm-anthropic")) {
      projectType = "ai-assistant";
    }
  }

  // Extract tech stack
  let language: string | null = null;
  let framework: string | null = null;
  for (const [keyword, tech] of Object.entries(TECH_KEYWORDS)) {
    if (lowerPrompt.includes(keyword)) {
      language = tech.language;
      framework = tech.framework ?? null;
      break;
    }
  }

  // Extract direct search terms
  const directTerms = lowerPrompt
    .split(/[\s,./]+/)
    .map(w => w.replace(/[^a-z0-9-]/g, ""))
    .filter(w => w.length >= 3 && !STOP_WORDS.has(w));

  return {
    projectType,
    capabilities: Array.from(capabilities),
    directTerms,
    techStack: { language, framework },
  };
}
