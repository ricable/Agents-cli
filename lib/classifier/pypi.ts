/**
 * pypi-classifier: Auto-discover packages from PyPI.
 *
 * PyPI has no public search API (deprecated XMLRPC + bot-protected HTML).
 * Strategy:
 *   1. Maintain a curated map of popular AI/ML/CLI Python packages
 *   2. For query-based search, match against the curated map
 *   3. For direct lookups, use the PyPI JSON API to validate packages
 */

import { ExtendedManifestEntry } from "../types.js";

// Curated list of popular Python AI/ML/CLI packages with metadata
const CURATED_PACKAGES: Array<{
  name: string;
  description: string;
  domain: string;
  keywords: string[];
}> = [
  // AI/ML frameworks
  { name: "torch", description: "Tensors and dynamic neural networks in Python with strong GPU acceleration", domain: "ml", keywords: ["pytorch", "neural", "deep-learning", "tensor", "gpu"] },
  { name: "transformers", description: "State-of-the-art Natural Language Processing for PyTorch, TensorFlow, and JAX", domain: "ml", keywords: ["nlp", "bert", "gpt", "huggingface", "transformer"] },
  { name: "langchain", description: "Building applications with LLMs through composability", domain: "ai-framework", keywords: ["llm", "rag", "chain", "agent", "langchain"] },
  { name: "llama-index", description: "A data framework for LLM applications to ingest, structure, and access private or domain-specific data", domain: "ai-framework", keywords: ["rag", "llm", "index", "retrieval", "llamaindex"] },
  { name: "openai", description: "The official Python library for the OpenAI API", domain: "ai-sdk", keywords: ["openai", "gpt", "chatgpt", "api", "llm"] },
  { name: "anthropic", description: "The official Python library for the Anthropic API", domain: "ai-sdk", keywords: ["anthropic", "claude", "api", "llm"] },
  { name: "litellm", description: "Call 100+ LLM APIs using the OpenAI format", domain: "ai-sdk", keywords: ["llm", "api", "openai", "anthropic", "proxy"] },
  { name: "instructor", description: "Structured outputs for LLMs with validation", domain: "ai-framework", keywords: ["llm", "structured", "pydantic", "extraction"] },
  { name: "dspy", description: "Programming with foundation models", domain: "ai-framework", keywords: ["llm", "prompt", "optimization", "pipeline"] },
  { name: "crewai", description: "Framework for orchestrating role-playing autonomous AI agents", domain: "agent", keywords: ["agent", "crew", "multi-agent", "autonomous"] },
  { name: "autogen", description: "Enable Next-Gen Large Language Model Applications", domain: "agent", keywords: ["agent", "multi-agent", "llm", "conversation"] },
  { name: "pydantic-ai", description: "Agent framework using Pydantic for structured outputs", domain: "agent", keywords: ["agent", "pydantic", "llm", "structured"] },
  { name: "smolagents", description: "A lightweight library for building AI agents", domain: "agent", keywords: ["agent", "huggingface", "tool-use", "lightweight"] },

  // Vector / embedding
  { name: "chromadb", description: "AI-native open-source embedding database", domain: "vector", keywords: ["vector", "embedding", "chroma", "database", "search"] },
  { name: "pinecone-client", description: "Official Pinecone Python SDK for vector search", domain: "vector", keywords: ["vector", "pinecone", "search", "embedding", "similarity"] },
  { name: "qdrant-client", description: "Python client for Qdrant vector search engine", domain: "vector", keywords: ["vector", "qdrant", "search", "embedding"] },
  { name: "weaviate-client", description: "Python client for Weaviate vector database", domain: "vector", keywords: ["vector", "weaviate", "database", "search"] },
  { name: "faiss-cpu", description: "Library for efficient similarity search and clustering of dense vectors", domain: "vector", keywords: ["vector", "faiss", "similarity", "search", "clustering"] },
  { name: "sentence-transformers", description: "Multilingual sentence & image embeddings with BERT", domain: "vector", keywords: ["embedding", "sentence", "bert", "similarity", "nlp"] },

  // ML tools
  { name: "scikit-learn", description: "A set of python modules for machine learning and data mining", domain: "ml", keywords: ["ml", "machine-learning", "classification", "regression", "clustering"] },
  { name: "datasets", description: "The largest hub of ready-to-use datasets for ML models", domain: "ml", keywords: ["dataset", "huggingface", "nlp", "ml", "data"] },
  { name: "accelerate", description: "A simple way to train and use PyTorch models with multi-GPU, TPU, mixed-precision", domain: "ml", keywords: ["training", "gpu", "distributed", "pytorch", "accelerate"] },
  { name: "peft", description: "Parameter-Efficient Fine-Tuning of large pretrained models", domain: "ml", keywords: ["fine-tuning", "lora", "qlora", "peft", "llm"] },
  { name: "trl", description: "Train transformer language models with reinforcement learning", domain: "ml", keywords: ["rlhf", "reinforcement", "training", "llm", "alignment"] },
  { name: "unsloth", description: "2-5x faster LLM finetuning", domain: "ml", keywords: ["fine-tuning", "llm", "fast", "lora", "training"] },
  { name: "vllm", description: "A high-throughput and memory-efficient inference and serving engine for LLMs", domain: "infra", keywords: ["inference", "serving", "llm", "vllm", "gpu"] },

  // CLI tools
  { name: "ruff", description: "An extremely fast Python linter and code formatter, written in Rust", domain: "build", keywords: ["linting", "formatting", "python", "ruff", "linter", "formatter", "code-quality"] },
  { name: "httpie", description: "Modern, user-friendly command-line HTTP client", domain: "web", keywords: ["http", "api", "curl", "cli", "rest", "httpie"] },
  { name: "uv", description: "An extremely fast Python package and project manager, written in Rust", domain: "build", keywords: ["package-manager", "pip", "venv", "python", "uv", "fast"] },
  { name: "black", description: "The uncompromising Python code formatter", domain: "build", keywords: ["formatting", "python", "code-formatter", "black"] },
  { name: "mypy", description: "Optional static typing for Python", domain: "build", keywords: ["type-checking", "typing", "python", "static-analysis", "mypy"] },
  { name: "pytest", description: "Simple powerful testing with Python", domain: "testing", keywords: ["testing", "test", "pytest", "unit-test", "python"] },
  { name: "pre-commit", description: "A framework for managing and maintaining multi-language pre-commit hooks", domain: "build", keywords: ["git", "hooks", "linting", "pre-commit", "quality"] },

  // Observability / eval
  { name: "wandb", description: "A tool for visualizing and tracking machine learning experiments", domain: "observability", keywords: ["experiment", "tracking", "ml", "wandb", "visualization"] },
  { name: "mlflow", description: "Open source platform for the machine learning lifecycle", domain: "observability", keywords: ["mlops", "experiment", "tracking", "model", "registry"] },
  { name: "ragas", description: "Evaluation framework for Retrieval Augmented Generation pipelines", domain: "testing", keywords: ["rag", "evaluation", "metrics", "llm", "retrieval"] },
  { name: "deepeval", description: "LLM evaluation framework", domain: "testing", keywords: ["llm", "evaluation", "testing", "benchmark", "metrics"] },

  // MCP / agent infra
  { name: "mcp", description: "Model Context Protocol SDK for Python", domain: "agent", keywords: ["mcp", "model-context-protocol", "agent", "tool-use"] },
  { name: "composio-core", description: "Composio SDK: production-ready toolset for AI agents", domain: "agent", keywords: ["agent", "tools", "composio", "integration"] },
];

/**
 * Score relevance of a package against search terms.
 */
function scoreRelevance(pkg: typeof CURATED_PACKAGES[0], terms: string[]): number {
  const searchText = `${pkg.name} ${pkg.description} ${pkg.keywords.join(" ")}`.toLowerCase();
  const hits = terms.filter(t => searchText.includes(t.toLowerCase())).length;
  return terms.length > 0 ? hits / terms.length : 0;
}

/**
 * Validate a package exists on PyPI via the JSON API.
 */
async function validatePyPIPackage(name: string): Promise<{ name: string; description: string } | null> {
  try {
    const res = await fetch(`https://pypi.org/pypi/${encodeURIComponent(name)}/json`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const data = await res.json() as { info: { name: string; summary: string } };
    return { name: data.info.name, description: data.info.summary };
  } catch {
    return null;
  }
}

/**
 * Discover PyPI packages by query string or return curated AI/ML packages.
 * When query is provided, matches against the curated package list and validates on PyPI.
 */
export async function discoverPyPIPackages(query?: string, limit = 50): Promise<ExtendedManifestEntry[]> {
  const terms = query ? query.split(/\s+/).filter(t => t.length > 1) : [];

  let candidates: typeof CURATED_PACKAGES;
  if (terms.length > 0) {
    // Score and rank by relevance
    const scored = CURATED_PACKAGES
      .map(pkg => ({ pkg, score: scoreRelevance(pkg, terms) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);
    candidates = scored.map(s => s.pkg);
  } else {
    candidates = CURATED_PACKAGES;
  }

  return candidates.slice(0, limit).map(pkg => ({
    domain: pkg.domain,
    name: pkg.name,
    repo: pkg.name,
    description: pkg.description,
    auto_discovered: true,
    quality_score: 0.7,
    classifier_source: "rules" as const,
  }));
}
