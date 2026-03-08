/**
 * Capability to search terms mapping.
 */

import type { Capability } from "../types.js";

export const CAPABILITY_SEARCH_MAP: Record<Capability, {
  github: string[];
  npm: string[];
  crates: string[];
}> = {
  "image-generation": {
    github: ["image-generation", "stable-diffusion", "dalle", "flux", "diffusion-model"],
    npm: ["image-generation", "stable-diffusion", "canvas", "sharp"],
    crates: ["image", "diffusion", "image-processing"],
  },
  "video-generation": {
    github: ["video-generation", "video-ai", "runway", "pika"],
    npm: ["video-processing", "ffmpeg"],
    crates: ["video", "video-encoding"],
  },
  "audio-generation": {
    github: ["text-to-speech", "tts", "audio-generation", "elevenlabs"],
    npm: ["tts", "text-to-speech", "elevenlabs"],
    crates: ["audio", "speech", "tts"],
  },
  "social-facebook": {
    github: ["facebook-api", "facebook-sdk"],
    npm: ["facebook-sdk", "facebook-node-sdk"],
    crates: ["facebook"],
  },
  "social-tiktok": {
    github: ["tiktok-api", "tiktok-sdk"],
    npm: ["tiktok-api"],
    crates: ["tiktok"],
  },
  "social-instagram": {
    github: ["instagram-api", "instagram-sdk"],
    npm: ["instagram-api", "instagram-sdk"],
    crates: ["instagram"],
  },
  "social-linkedin": {
    github: ["linkedin-api", "linkedin-sdk"],
    npm: ["linkedin-api", "linkedin-sdk"],
    crates: ["linkedin"],
  },
  "social-twitter": {
    github: ["twitter-api", "x-api", "twitter-v2"],
    npm: ["twitter-api-v2", "twitter", "x-v2"],
    crates: ["twitter", "async", "twitter-api"],
  },
  "social-youtube": {
    github: ["youtube-api", "youtube-sdk"],
    npm: ["youtube-api", "youtube-node"],
    crates: ["youtube", "google-apis"],
  },
  "payments-stripe": {
    github: ["stripe-node", "stripe-api"],
    npm: ["stripe", "@stripe/stripe-js"],
    crates: ["stripe"],
  },
  "payments-paypal": {
    github: ["paypal-sdk", "paypal-rest-sdk"],
    npm: ["@paypal/checkout-server-sdk", "paypal-rest-sdk"],
    crates: ["paypal"],
  },
  "llm-openai": {
    github: ["openai-node", "openai-api"],
    npm: ["openai", "gpt"],
    crates: ["openai", "gpt3"],
  },
  "llm-anthropic": {
    github: ["anthropic-sdk", "claude-api"],
    npm: ["@anthropic-ai/sdk", "anthropic"],
    crates: ["anthropic"],
  },
  "llm-google": {
    github: ["google-ai-platform", "gemini-api"],
    npm: ["@google/generative-ai", "gemini"],
    crates: ["google-ai", "gemini"],
  },
  "llm-local": {
    github: ["ollama", "llama.cpp", "local-llm"],
    npm: ["ollama", "llama-node"],
    crates: ["ollama", "llama", "llama2"],
  },
  "llm-aws-bedrock": {
    github: ["aws-bedrock-sdk", "bedrock-runtime"],
    npm: ["@aws-sdk/client-bedrock-runtime", "amazon-bedrock"],
    crates: ["aws-bedrock", "bedrock"],
  },
  "vector-storage": {
    github: ["vector-database", "qdrant", "weaviate", "milvus"],
    npm: ["qdrant", "weaviate", "milvus"],
    crates: ["qdrant", "vector-db", "weaviate"],
  },
  "embedding": {
    github: ["embedding-model", "text-embedding", "sentence-transformers"],
    npm: ["embedding", "sentence-transformers"],
    crates: ["embedding", "sentence-embedding"],
  },
  "rag": {
    github: ["rag", "retrieval-augmented", "langchain"],
    npm: ["langchain", "llamaindex", "rag"],
    crates: ["rag"],
  },
  "mcp": {
    github: ["model-context-protocol", "mcp-server"],
    npm: ["@modelcontextprotocol/sdk", "mcp"],
    crates: ["mcp"],
  },
  "agent": {
    github: ["ai-agent", "autonomous-agent", "agent-framework"],
    npm: ["agent", "ai-agent", "autonomous"],
    crates: ["agent", "autonomous"],
  },
  "browser-automation": {
    github: ["puppeteer", "playwright", "browser-automation"],
    npm: ["puppeteer", "playwright"],
    crates: ["puppeteer", "playwright", "headless"],
  },
  "email": {
    github: ["nodemailer", "sendgrid", "mailgun"],
    npm: ["nodemailer", "@sendgrid/mail"],
    crates: ["mail", "smtp"],
  },
  "database": {
    github: ["database", "orm", "prisma", "drizzle"],
    npm: ["prisma", "drizzle-orm", "mongoose"],
    crates: ["database", "sqlx", "diesel"],
  },
  "storage": {
    github: ["s3", "aws-s3", "storage-sdk"],
    npm: ["@aws-sdk/client-s3", "minio"],
    crates: ["s3", "storage"],
  },
  "websocket": {
    github: ["websocket", "socket.io", "ws"],
    npm: ["socket.io", "ws"],
    crates: ["websocket", "tokio-tungstenite"],
  },
  "api-gateway": {
    github: ["api-gateway", "express-gateway", "kong"],
    npm: ["express", "fastify", "hono"],
    crates: ["api-gateway", "axum", "warp"],
  },
  "authentication": {
    github: ["authentication", "auth", "nextauth", "clerk"],
    npm: ["next-auth", "clerk", "@auth0/nextjs-auth0"],
    crates: ["auth", "oauth", "jwt"],
  },
};
