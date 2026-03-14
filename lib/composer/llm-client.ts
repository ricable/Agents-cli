/**
 * Tiered LLM client: Ollama for batch/draft, Claude API for validation/refinement.
 *
 * Auto-routes tasks based on type:
 * - propose/repair → Ollama (free, local)
 * - validate/refine → Claude API (quality)
 *
 * Falls back to Ollama-only mode when Claude API key is not set.
 */

import { validateOllamaUrl, DEFAULT_OLLAMA_URL } from "../guards.js";

// ── Constants ──────────────────────────────────────────────────────────

const OLLAMA_HEALTH_TIMEOUT_MS = 3_000;
const OLLAMA_MODEL_LIST_TIMEOUT_MS = 5_000;
const OLLAMA_GENERATE_TIMEOUT_MS = 120_000;
const CLAUDE_API_TIMEOUT_MS = 60_000;
const DEFAULT_SYSTEM_PROMPT = "You are a workflow composition expert.";

/** Extract text content from Claude API response blocks. */
function parseClaudeContent(content: Array<{ type: string; text?: string }>): string {
  return content
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("");
}

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
  private resolvedModel: string | null = null;

  constructor(config?: TieredLLMConfig) {
    this.ollamaUrl = config?.ollamaUrl ?? DEFAULT_OLLAMA_URL;
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

    // Try Ollama first, fall back to Claude for any task if Ollama fails
    try {
      return await this.generateOllama(task, prompt, systemPrompt);
    } catch (ollamaErr) {
      if (this.claudeApiKey) {
        return this.generateClaude(task, prompt, systemPrompt);
      }
      throw ollamaErr;
    }
  }

  /** Check if Ollama is available */
  async isOllamaAvailable(): Promise<boolean> {
    try {
      validateOllamaUrl(this.ollamaUrl);
      const response = await fetch(`${this.ollamaUrl}/api/tags`, {
        signal: AbortSignal.timeout(OLLAMA_HEALTH_TIMEOUT_MS),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Detect an available Ollama model. If the configured model is not installed,
   * falls back to the first available model.
   */
  private async resolveOllamaModel(): Promise<string> {
    if (this.resolvedModel) return this.resolvedModel;
    try {
      const response = await fetch(`${this.ollamaUrl}/api/tags`, {
        signal: AbortSignal.timeout(OLLAMA_MODEL_LIST_TIMEOUT_MS),
      });
      if (!response.ok) return this.ollamaModel;
      const data = await response.json() as { models: Array<{ name: string }> };
      const available = data.models?.map((m) => m.name) ?? [];
      if (available.length === 0) {
        throw new Error("No Ollama models installed. Run: ollama pull llama3.2");
      }
      // Check if configured model is available
      if (available.some((m) => m === this.ollamaModel || m.startsWith(this.ollamaModel + ":"))) {
        this.resolvedModel = this.ollamaModel;
        return this.resolvedModel;
      }
      // Fall back to first available model
      this.resolvedModel = available[0]!;
      return this.resolvedModel;
    } catch (err) {
      if (err instanceof Error && err.message.includes("No Ollama models")) throw err;
      return this.ollamaModel;
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
    const model = await this.resolveOllamaModel();

    const body: Record<string, unknown> = {
      model,
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
      signal: AbortSignal.timeout(OLLAMA_GENERATE_TIMEOUT_MS),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      const hint = errBody.includes("failed to load")
        ? `. Model "${model}" may be too large for available resources. Try: ollama pull llama3.2`
        : "";
      throw new Error(`Ollama error: ${response.status} ${response.statusText}${hint}`);
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
        system: systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
        messages,
      });

      const content = parseClaudeContent(response.content);

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
        system: systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(CLAUDE_API_TIMEOUT_MS),
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

    const content = parseClaudeContent(result.content);

    return {
      content,
      model: result.model,
      task,
      tokensUsed: result.usage?.output_tokens,
      durationMs: Date.now() - start,
    };
  }
}

