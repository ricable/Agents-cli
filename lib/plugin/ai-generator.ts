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

// ── Multi-agent generation (expert + workers) ─────────────────────────

/** Domain → worker agent configurations */
const DOMAIN_AGENT_MAP: Record<string, Array<{ suffix: string; description: string; toolPatterns: string[] }>> = {
  "agents": [
    { suffix: "orchestrator", description: "Multi-agent workflow orchestration", toolPatterns: ["Bash", "Agent"] },
    { suffix: "evaluator", description: "Agent output evaluation and scoring", toolPatterns: ["Read", "Grep", "Bash"] },
  ],
  "cloud": [
    { suffix: "planner", description: "Cloud infrastructure planning", toolPatterns: ["Bash(terraform *)", "Bash(aws *)", "Bash(gcloud *)"] },
    { suffix: "validator", description: "Cloud security and policy validation", toolPatterns: ["Read", "Grep", "Bash"] },
  ],
  "general": [
    { suffix: "analyzer", description: "Code and file analysis", toolPatterns: ["Read", "Grep", "Glob"] },
    { suffix: "executor", description: "Task execution and automation", toolPatterns: ["Bash"] },
  ],
  "python": [
    { suffix: "linter", description: "Python linting with ruff/flake8", toolPatterns: ["Bash(ruff *)", "Bash(flake8 *)"] },
    { suffix: "tester", description: "Python testing with pytest", toolPatterns: ["Bash(pytest *)", "Bash(python -m pytest *)"] },
    { suffix: "formatter", description: "Python formatting with ruff/black", toolPatterns: ["Bash(ruff format *)", "Bash(black *)"] },
  ],
  "javascript": [
    { suffix: "linter", description: "JavaScript/TypeScript linting with eslint", toolPatterns: ["Bash(eslint *)", "Bash(npx eslint *)"] },
    { suffix: "type-checker", description: "TypeScript type checking", toolPatterns: ["Bash(tsc *)", "Bash(npx tsc *)"] },
    { suffix: "tester", description: "JavaScript testing with jest/vitest", toolPatterns: ["Bash(jest *)", "Bash(vitest *)"] },
  ],
  "database": [
    { suffix: "migrator", description: "Database migration management", toolPatterns: ["Bash"] },
    { suffix: "query-validator", description: "SQL query validation and optimization", toolPatterns: ["Bash", "Read", "Grep"] },
  ],
  "security": [
    { suffix: "scanner", description: "Security vulnerability scanning", toolPatterns: ["Bash(trivy *)", "Bash(semgrep *)", "Bash(snyk *)"] },
    { suffix: "auditor", description: "Dependency and configuration auditing", toolPatterns: ["Bash(npm audit *)", "Bash(pip-audit *)", "Read", "Grep"] },
  ],
  "devops": [
    { suffix: "validator", description: "Infrastructure configuration validation", toolPatterns: ["Bash(docker *)", "Bash(kubectl *)", "Bash(terraform *)"] },
    { suffix: "deployer", description: "Deployment pipeline execution", toolPatterns: ["Bash"] },
  ],
  "git": [
    { suffix: "reviewer", description: "Code review and diff analysis", toolPatterns: ["Bash(git *)", "Read", "Grep", "Glob"] },
    { suffix: "merger", description: "Merge conflict resolution", toolPatterns: ["Bash(git *)", "Edit", "Read"] },
  ],
  "testing": [
    { suffix: "generator", description: "Test case generation", toolPatterns: ["Read", "Write", "Grep"] },
    { suffix: "runner", description: "Test execution and coverage", toolPatterns: ["Bash"] },
  ],
};

/**
 * Build rich YAML frontmatter for an agent markdown file.
 */
export function buildAgentFrontmatter(opts: {
  name: string;
  description: string;
  model?: "sonnet" | "haiku";
  memory?: string;
  maxTurns?: number;
  tools?: string[];
  skills?: string[];
  hooks?: string[];
}): string {
  const lines: string[] = ["---"];
  lines.push(`name: ${opts.name}`);
  lines.push(`description: "${opts.description.replace(/"/g, "''")}"`);
  if (opts.model) lines.push(`model: ${opts.model}`);
  if (opts.memory) lines.push(`memory: ${opts.memory}`);
  if (opts.maxTurns) lines.push(`maxTurns: ${opts.maxTurns}`);
  if (opts.tools && opts.tools.length > 0) {
    lines.push(`allowed-tools: "${opts.tools.join(" ")}"`);
  }
  if (opts.skills && opts.skills.length > 0) {
    lines.push(`skills:`);
    for (const s of opts.skills) lines.push(`  - ${s}`);
  }
  if (opts.hooks && opts.hooks.length > 0) {
    lines.push(`hooks:`);
    for (const h of opts.hooks) lines.push(`  - ${h}`);
  }
  lines.push("---");
  return lines.join("\n");
}

/**
 * Generate default multi-agent markdown for a domain (expert + workers).
 * Returns 2-5 agents per domain.
 */
export function defaultMultiAgentMarkdown(
  domain: string,
  pkgNames: string[],
): AgentMarkdownFile[] {
  const agents: AgentMarkdownFile[] = [];
  const flatDomain = domain.replace(/\//g, "-");
  const baseDomain = domain.split("/")[0]!;

  // 1. Expert agent (always generated)
  const expertName = `${flatDomain}-expert`;
  const toolList = pkgNames.slice(0, 20).join(", ");
  const expertFrontmatter = buildAgentFrontmatter({
    name: expertName,
    description: `Specializes in ${domain} tools and workflows. Use when working with ${pkgNames.slice(0, 5).join(", ")} or related ${domain} tasks.`,
    model: "sonnet",
    memory: "user",
    tools: ["Read", "Grep", "Glob", "Bash", "Agent"],
    skills: pkgNames.slice(0, 10),
  });

  const expertContent = [
    expertFrontmatter,
    "",
    `You are a senior ${domain} expert agent with deep knowledge of ${domain} tools and best practices.`,
    "",
    "## Available Tools",
    "",
    `You have expertise with: ${toolList}`,
    "",
    "## How to Help",
    "",
    `When the user asks about ${domain} topics:`,
    `1. Identify which tool(s) are relevant to their question`,
    `2. Search skill documentation for the specific tool's commands and flags`,
    `3. Provide concrete, working examples — never fabricate commands`,
    `4. Explain configuration options and best practices`,
    `5. For complex tasks, delegate to specialized worker agents`,
    "",
    "## CLI-First Doctrine",
    "",
    "1. Use CLI tools from loaded skills first",
    "2. Fall back to Bash for unsupported operations",
    "3. Use MCP only when no CLI alternative exists",
    "4. Never use raw API calls when a CLI tool is available",
    "",
    "## Error Patterns",
    "",
    "- If a command fails, check the tool's troubleshooting guide first",
    "- Verify the tool is installed before running commands",
    "- Use --help to discover available flags — never guess",
    "",
    "## Constraints",
    "",
    "- Only recommend tools from this domain",
    "- Provide working commands — do not fabricate flags or subcommands",
    "- When unsure, search the tool's help output or documentation first",
    "- Delegate specialized tasks to worker agents when available",
    "",
  ].join("\n");

  agents.push({ name: expertName, content: expertContent });

  // 2. Worker agents (domain-specific)
  const workers = DOMAIN_AGENT_MAP[baseDomain];
  if (workers) {
    for (const worker of workers) {
      const workerName = `${flatDomain}-${worker.suffix}`;
      const workerFrontmatter = buildAgentFrontmatter({
        name: workerName,
        description: `${worker.description}. Use when the ${domain} team needs a ${worker.suffix} specialist.`,
        model: "haiku",
        maxTurns: 3,
        tools: worker.toolPatterns,
      });

      const workerContent = [
        workerFrontmatter,
        "",
        `You are a specialized ${worker.suffix} agent for ${domain} workflows.`,
        "",
        "## Your Role",
        "",
        worker.description,
        "",
        "## Constraints",
        "",
        `- Focus only on ${worker.suffix} tasks — delegate other work back to the expert`,
        "- Complete your work within 3 turns",
        "- Report results in structured format",
        "- Do not fabricate commands — verify before running",
        "",
      ].join("\n");

      agents.push({ name: workerName, content: workerContent });
    }
  }

  return agents;
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
