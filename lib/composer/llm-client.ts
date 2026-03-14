/**
 * Tiered LLM client: Ollama for batch/draft, Claude API for validation/refinement.
 *
 * Auto-routes tasks based on type:
 * - propose/repair → Ollama (free, local)
 * - validate/refine → Claude API (quality)
 *
 * Falls back to Ollama-only mode when Claude API key is not set.
 */

import { validateOllamaUrl } from "../guards.js";

// ── Types ──────────────────────────────────────────────────────────────

export type LLMTask = "propose" | "repair" | "validate" | "refine";

export interface LLMResponse {
  content: string;
  model: string;
  task: LLMTask;
  tokensUsed?: number;
  durationMs: number;
}

export interface TieredLLMConfig {
  /** Ollama URL (default: http://127.0.0.1:11434) */
  ollamaUrl?: string;
  /** Ollama model for drafting (default: llama3.2) */
  ollamaModel?: string;
  /** Claude API key (reads ANTHROPIC_API_KEY env var) */
  claudeApiKey?: string;
  /** Claude model (default: claude-sonnet-4-20250514) */
  claudeModel?: string;
  /** Max tokens for generation */
  maxTokens?: number;
}

// ── Client ─────────────────────────────────────────────────────────────

export class TieredLLMClient {
  private readonly ollamaUrl: string;
  private readonly ollamaModel: string;
  private readonly claudeApiKey: string | undefined;
  private readonly claudeModel: string;
  private readonly maxTokens: number;

  constructor(config?: TieredLLMConfig) {
    this.ollamaUrl = config?.ollamaUrl ?? process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";
    this.ollamaModel = config?.ollamaModel ?? process.env.OLLAMA_MODEL ?? "llama3.2";
    this.claudeApiKey = config?.claudeApiKey ?? process.env.ANTHROPIC_API_KEY;
    this.claudeModel = config?.claudeModel ?? "claude-sonnet-4-20250514";
    this.maxTokens = config?.maxTokens ?? 4096;
  }

  /**
   * Route a task to the appropriate LLM.
   * - propose/repair → Ollama (local, free)
   * - validate/refine → Claude (quality) with Ollama fallback
   */
  async generate(task: LLMTask, prompt: string, systemPrompt?: string): Promise<LLMResponse> {
    const useClaudeFor = new Set<LLMTask>(["validate", "refine"]);

    if (useClaudeFor.has(task) && this.claudeApiKey) {
      try {
        return await this.generateClaude(task, prompt, systemPrompt);
      } catch {
        // Fall back to Ollama
      }
    }

    return this.generateOllama(task, prompt, systemPrompt);
  }

  /** Check if Ollama is available */
  async isOllamaAvailable(): Promise<boolean> {
    try {
      validateOllamaUrl(this.ollamaUrl);
      const response = await fetch(`${this.ollamaUrl}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /** Check if Claude API is available */
  hasClaudeAccess(): boolean {
    return !!this.claudeApiKey;
  }

  // ── Ollama ───────────────────────────────────────────────────────

  private async generateOllama(task: LLMTask, prompt: string, systemPrompt?: string): Promise<LLMResponse> {
    validateOllamaUrl(this.ollamaUrl);
    const start = Date.now();

    const body: Record<string, unknown> = {
      model: this.ollamaModel,
      prompt,
      stream: false,
      options: {
        num_predict: this.maxTokens,
        temperature: task === "propose" ? 0.7 : 0.3,
      },
    };

    if (systemPrompt) {
      body.system = systemPrompt;
    }

    const response = await fetch(`${this.ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000), // 2 min timeout for large generations
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json() as {
      response: string;
      model: string;
      eval_count?: number;
    };

    return {
      content: result.response,
      model: result.model,
      task,
      tokensUsed: result.eval_count,
      durationMs: Date.now() - start,
    };
  }

  // ── Claude ───────────────────────────────────────────────────────

  private async generateClaude(task: LLMTask, prompt: string, systemPrompt?: string): Promise<LLMResponse> {
    const start = Date.now();

    // Try using @anthropic-ai/sdk first
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const modName = "@anthropic-ai/sdk";
      const sdk = await import(/* webpackIgnore: true */ modName) as any;
      const client = new sdk.default({ apiKey: this.claudeApiKey });

      const messages: Array<{ role: "user" | "assistant"; content: string }> = [
        { role: "user", content: prompt },
      ];

      const response = await client.messages.create({
        model: this.claudeModel,
        max_tokens: this.maxTokens,
        system: systemPrompt ?? "You are a workflow composition expert.",
        messages,
      });

      const content = response.content
        .filter((block: { type: string }) => block.type === "text")
        .map((block: { type: string; text: string }) => block.text)
        .join("");

      return {
        content,
        model: this.claudeModel,
        task,
        tokensUsed: response.usage?.output_tokens,
        durationMs: Date.now() - start,
      };
    } catch {
      // SDK not available — use raw HTTP
      return this.generateClaudeRaw(task, prompt, systemPrompt, start);
    }
  }

  private async generateClaudeRaw(task: LLMTask, prompt: string, systemPrompt: string | undefined, start: number): Promise<LLMResponse> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.claudeApiKey!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.claudeModel,
        max_tokens: this.maxTokens,
        system: systemPrompt ?? "You are a workflow composition expert.",
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Claude API error: ${response.status} ${text}`);
    }

    const result = await response.json() as {
      content: Array<{ type: string; text: string }>;
      model: string;
      usage?: { output_tokens: number };
    };

    const content = result.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    return {
      content,
      model: result.model,
      task,
      tokensUsed: result.usage?.output_tokens,
      durationMs: Date.now() - start,
    };
  }
}

