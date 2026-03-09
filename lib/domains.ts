/**
 * Domain trigger phrases for skill description generation.
 *
 * Maps domain identifiers to "Use when..." trigger clauses
 * that enable autonomous skill selection by AI agents.
 */

export const DOMAIN_TRIGGERS: Record<string, string> = {
  "agent":        "implementing AI agents, orchestrating multi-agent swarms, managing agent lifecycle, spawning workers",
  "ai-sdk":       "calling LLM APIs, streaming responses, using tool use, building AI-powered applications",
  "ai-framework": "building RAG pipelines, LLM orchestration, implementing agent frameworks, structured LLM outputs",
  "vector":       "vector search, similarity matching, HNSW indexing, embedding storage, semantic retrieval",
  "ml":           "training neural networks, implementing ML pipelines, backpropagation, FANN WASM models",
  "infra":        "deploying Kubernetes resources, WASM apps, local LLM serving, virtual clusters",
  "messaging":    "pub/sub messaging, JetStream streams, event-driven architecture, message queuing",
  "validation":   "schema validation, type-safe parsing, runtime type checking, Zod schemas",
  "testing":      "writing unit tests, mocking modules, test coverage, configuring test runners",
  "web":          "building HTTP servers, routing, middleware, REST APIs, edge functions",
  "database":     "database queries, ORM operations, migrations, SQL, data modeling",
  "runtime":      "Bun/Deno runtime APIs, server-side JavaScript, FFI, embedded runtimes",
  "build":        "bundling, build tooling, monorepo tasks, code splitting, tree shaking",
  "observability":"distributed tracing, metrics collection, structured logging, OTel instrumentation",
  "auth":         "authentication flows, session management, OAuth integration, multi-factor auth",
  "queue":        "job queues, background workers, task scheduling, retry strategies",
  "state":        "state management, reactive stores, derived state, React integration",
  "ui":           "React UI components, accessible primitives, styling, component variants",
  "wasm":         "WebAssembly bindings, WASM component model, Rust->WASM compilation, WASI",
};

/**
 * Infer a domain label for a tool based on its name, description, and tags.
 * Returns a DOMAIN_TRIGGERS key (e.g. "agent", "ml", "build").
 */
export function inferDomainLabel(tool: { meta: { name: string; description: string; tags: readonly string[] } }): string {
  const text = `${tool.meta.name} ${tool.meta.description} ${(tool.meta.tags as string[]).join(" ")}`.toLowerCase();
  let bestDomain = "build";
  let bestScore = 0;
  for (const [domain, triggers] of Object.entries(DOMAIN_TRIGGERS)) {
    const keywords = triggers.toLowerCase().split(/[,\s]+/).filter(k => k.length > 3);
    const hits = keywords.filter(k => text.includes(k)).length;
    if (hits > bestScore) { bestScore = hits; bestDomain = domain; }
  }
  return bestDomain;
}
