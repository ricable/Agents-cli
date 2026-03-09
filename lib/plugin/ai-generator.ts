/**
 * ai-generator: Generate Claude Code agent markdown files via Claude Haiku.
 *
 * Produces agent .md files with YAML frontmatter + system prompt, conforming
 * to the Claude Code plugin spec (agents/ directory format):
 *
 *   ---
 *   name: agent-name
 *   description: What this agent specializes in and when to invoke it
 *   ---
 *
 *   Detailed system prompt...
 *
 * @anthropic-ai/sdk is lazily imported — install it only when AI generation is needed.
 */

// ── Legacy AgentDef for backward compat with publisher.ts ──────────────

export interface AgentDef {
  name: string;
  description: string;
  allowedTools: string[];
}

// ── Agent markdown file (new format) ───────────────────────────────────

export interface AgentMarkdownFile {
  name: string;
  content: string;
}

/**
 * Return the default agent definition for a domain (legacy JSON format).
 */
export function defaultAgentDef(domain: string): AgentDef {
  return {
    name: `${domain}-expert`,
    description: `Search and retrieve ${domain} domain source code and documentation`,
    allowedTools: ["Read", "Grep", "Glob", "Bash"],
  };
}

/**
 * Generate default agent markdown for a domain (spec-compliant format).
 */
export function defaultAgentMarkdown(
  domain: string,
  pkgNames: string[]
): AgentMarkdownFile {
  const name = `${domain.replace(/\//g, "-")}-expert`;
  const toolList = pkgNames.slice(0, 20).join(", ");
  const content = [
    "---",
    `name: ${name}`,
    `description: Specializes in ${domain} tools and workflows. Use when working with ${pkgNames.slice(0, 5).join(", ")} or related ${domain} tasks.`,
    "---",
    "",
    `You are an expert in ${domain} tools and workflows.`,
    "",
    `## Available tools`,
    "",
    `You have expertise with the following tools: ${toolList}`,
    "",
    `## How to help`,
    "",
    `When the user asks about ${domain} topics:`,
    `1. Identify which tool(s) are relevant to their question`,
    `2. Search the codebase and documentation for the specific tool`,
    `3. Provide concrete examples and commands`,
    `4. Explain configuration options and best practices`,
    "",
    `## Constraints`,
    "",
    `- Only recommend tools you have knowledge of from this domain`,
    `- Provide working commands — do not fabricate flags or subcommands`,
    `- When unsure, search the tool's help output or documentation first`,
    "",
  ].join("\n");

  return { name, content };
}

/**
 * Generate agent markdown files via Claude Haiku for the given domain.
 *
 * Falls back to default markdown on any error.
 *
 * @param domain    Domain name, e.g. "agent" or "ai-ml/llm-inference"
 * @param pkgNames  Package names within the domain
 * @param apiKey    Anthropic API key
 */
export async function generateAgentMarkdown(
  domain: string,
  pkgNames: string[],
  apiKey: string
): Promise<AgentMarkdownFile[]> {
  const defaults = [defaultAgentMarkdown(domain, pkgNames)];

  // Lazy import of @anthropic-ai/sdk
  let Anthropic: any;
  try {
    // @ts-expect-error -- optional peer dependency, lazily loaded
    const mod = await import("@anthropic-ai/sdk");
    Anthropic = mod.default ?? mod;
  } catch {
    throw new Error(
      "Install @anthropic-ai/sdk for AI agent generation: npm i @anthropic-ai/sdk"
    );
  }

  const client = new Anthropic({ apiKey });
  const flatDomain = domain.replace(/\//g, "-");

  const prompt = [
    `Generate 1-2 Claude Code agent markdown files for the "${domain}" domain.`,
    `Tools in this domain: ${pkgNames.join(", ")}.`,
    "",
    "Each agent must be a markdown document with YAML frontmatter containing `name` and `description` fields.",
    "The `name` must be kebab-case. The `description` must include trigger phrases starting with 'Use when'.",
    "",
    "Format your response as one or two markdown documents separated by '---SEPARATOR---'.",
    "",
    "Example:",
    "```",
    "---",
    `name: ${flatDomain}-expert`,
    `description: Specializes in ${domain} tools. Use when working with ${pkgNames.slice(0, 3).join(", ")} or related tasks.`,
    "---",
    "",
    `You are an expert in ${domain} tools...`,
    "```",
    "",
    "Requirements:",
    "- name: kebab-case, no slashes",
    "- description: include 'Use when' trigger phrase",
    "- Body: detailed system prompt with tool expertise, how to help, constraints",
    "- Do NOT fabricate tool commands — only reference the tool names listed",
  ].join("\n");

  let text = "";

  try {
    const response = await Promise.race([
      client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Haiku timeout after 15s")), 15_000)
      ),
    ]);

    const block = response.content[0];
    if (block.type !== "text") return defaults;
    text = block.text;
  } catch {
    return defaults;
  }

  // Parse response into agent markdown files
  const agents: AgentMarkdownFile[] = [];
  const docs = text.split("---SEPARATOR---").map(s => s.trim()).filter(Boolean);

  for (const doc of docs) {
    // Strip markdown code fences if present
    const cleaned = doc.replace(/^```(?:markdown)?\n?/m, "").replace(/\n?```$/m, "").trim();

    // Validate it has frontmatter
    if (!cleaned.startsWith("---")) continue;

    // Extract name from frontmatter
    const nameMatch = cleaned.match(/^---[\s\S]*?name:\s*(.+?)$/m);
    if (!nameMatch) continue;

    const name = nameMatch[1]!.trim().replace(/["']/g, "");

    // Validate kebab-case, no slashes
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(name)) continue;

    agents.push({ name, content: cleaned });
  }

  return agents.length > 0 ? agents : defaults;
}

// ── Backward-compatible export (used by publisher.ts) ──────────────────

/**
 * Generate agent defs (legacy JSON format) — wraps markdown generation.
 * Note: AI-enhanced generation is handled by generateAgentMarkdown().
 * This legacy wrapper uses pkgNames to build a richer default description
 * but does not call the AI API (use generateAgentMarkdown for AI features).
 */
export async function generateAgentDefs(
  domain: string,
  pkgNames: string[],
  _apiKey: string
): Promise<AgentDef[]> {
  const def = defaultAgentDef(domain);
  // Enrich description with package names when available
  if (pkgNames.length > 0) {
    const tools = pkgNames.slice(0, 5).join(", ");
    def.description = `Search and retrieve ${domain} domain source code and documentation. Covers: ${tools}`;
  }
  return [def];
}
