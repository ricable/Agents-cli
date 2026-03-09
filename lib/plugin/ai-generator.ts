/**
 * ai-generator: Generate Claude Code agent definitions via Claude Haiku.
 *
 * Uses claude-haiku-4-5-20251001 to produce 1-2 agent definitions for a given
 * domain, based on the package names contained in that domain.
 *
 * @anthropic-ai/sdk is lazily imported — install it only when AI generation is needed.
 */

export interface AgentDef {
  name: string;
  description: string;
  allowedTools: string[];
}

/**
 * Return the default agent definition for a domain.
 */
export function defaultAgentDef(domain: string): AgentDef {
  return {
    name: `src-${domain}`,
    description: `Search and retrieve ${domain} domain source code`,
    allowedTools: ["mcp__opensrc__search", "mcp__opensrc__read"],
  };
}

/**
 * Generate 1-2 agent definitions for the given domain and package names.
 *
 * Falls back to a default agent definition on any error (network timeout,
 * parse failure, missing API key, etc.).
 *
 * @param domain    Domain name, e.g. "agent"
 * @param pkgNames  Package names within the domain, e.g. ["claude-flow", "kagent"]
 * @param apiKey    Anthropic API key
 */
export async function generateAgentDefs(
  domain: string,
  pkgNames: string[],
  apiKey: string
): Promise<AgentDef[]> {
  const defaultAgents: AgentDef[] = [defaultAgentDef(domain)];

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

  const prompt =
    `Generate 1-2 Claude Code agent definitions for the ${domain} domain containing packages: ` +
    `${pkgNames.join(", ")}. ` +
    `Return JSON array: [{name, description, allowedTools}]. ` +
    `allowedTools should use mcp__opensrc__* tools.`;

  let text = "";

  try {
    const response = await Promise.race([
      client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Haiku timeout after 15s")),
          15_000
        )
      ),
    ]);

    const block = response.content[0];
    if (block.type !== "text") {
      return defaultAgents;
    }
    text = block.text;
  } catch {
    return defaultAgents;
  }

  // Extract JSON array from the response (may be wrapped in markdown fences)
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return defaultAgents;
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as unknown[];
    const agents: AgentDef[] = [];

    for (const item of parsed) {
      if (
        typeof item === "object" &&
        item !== null &&
        "name" in item &&
        "description" in item &&
        "allowedTools" in item &&
        typeof (item as Record<string, unknown>).name === "string" &&
        typeof (item as Record<string, unknown>).description === "string" &&
        Array.isArray((item as Record<string, unknown>).allowedTools)
      ) {
        agents.push({
          name: String((item as Record<string, unknown>).name),
          description: String(
            (item as Record<string, unknown>).description
          ),
          allowedTools: (
            (item as Record<string, unknown>).allowedTools as unknown[]
          ).map(String),
        });
      }
    }

    return agents.length > 0 ? agents : defaultAgents;
  } catch {
    return defaultAgents;
  }
}
