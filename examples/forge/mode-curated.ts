/**
 * forge/mode-curated.ts — Curated tool registry → forge skills.
 */

import { join, resolve, dirname } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { success, emit } from "../../lib/output.js";
import { loadAllTools, type CliTool } from "../../lib/curated-tools.js";
import type { CliArgs, BatchItem } from "./types.js";
import { OUTPUT_DIR } from "./types.js";
import { log, fmtTable } from "./helpers.js";
import { processBatch, buildIndexes } from "./stages.js";

/**
 * Override map: GitHub repos → package manager source for better skill quality.
 *
 * GitHub sources produce 0 commands because the analyzer can't run uncompiled
 * binaries. Using the correct package manager prefix (pypi:/npm:/crates:) lets
 * the installer install the actual package so the analyzer can run --help and
 * detect real commands.
 *
 * Format: "owner/repo" → "prefix:package-name"
 */
const GITHUB_TO_PKG: Record<string, string> = {
  // Python CLI tools (pypi)
  "astral-sh/uv": "pypi:uv",
  "astral-sh/ruff": "pypi:ruff",
  "httpie/cli": "pypi:httpie",
  "commitizen-tools/commitizen": "pypi:commitizen",
  "wireservice/csvkit": "pypi:csvkit",
  "pre-commit/pre-commit": "pypi:pre-commit",
  "pypa/pipx": "pypi:pipx",
  "aws/aws-cli": "pypi:awscli",
  "pytest-dev/pytest": "pypi:pytest",
  "wandb/wandb": "pypi:wandb",
  "gradio-app/gradio": "pypi:gradio",
  "aimhubio/aim": "pypi:aim",
  "HumanSignal/label-studio": "pypi:label-studio",
  "langfuse/langfuse": "pypi:langfuse",
  "argilla-io/argilla": "pypi:argilla",
  "spotify/annoy": "pypi:annoy",
  "SeldonIO/alibi-detect": "pypi:alibi-detect",
  "automl/auto-sklearn": "pypi:auto-sklearn",
  "facebookresearch/audiocraft": "pypi:audiocraft",
  "intel/auto-round": "pypi:auto-round",
  "agno-agi/agno": "pypi:agno",
  "BerriAI/litellm": "pypi:litellm",
  "protectai/llm-guard": "pypi:llm-guard",
  "paul-gauthier/aider": "pypi:aider-chat",
  "Chainlit/chainlit": "pypi:chainlit",
  "crewAIInc/crewAI": "pypi:crewai",
  "vllm-project/vllm": "pypi:vllm",
  "huggingface/transformers": "pypi:transformers",
  "huggingface/diffusers": "pypi:diffusers",
  "huggingface/datasets": "pypi:datasets",
  "huggingface/accelerate": "pypi:accelerate",
  "huggingface/tokenizers": "pypi:tokenizers",
  "bentoml/BentoML": "pypi:bentoml",
  "mlflow/mlflow": "pypi:mlflow",
  "ray-project/ray": "pypi:ray",
  "Lightning-AI/pytorch-lightning": "pypi:pytorch-lightning",
  "PaddlePaddle/PaddleOCR": "pypi:paddleocr",
  "explosion/spaCy": "pypi:spacy",
  "facebookresearch/detectron2": "pypi:detectron2",
  "deepset-ai/haystack": "pypi:farm-haystack",
  "mitmproxy/mitmproxy": "pypi:mitmproxy",
  "psf/black": "pypi:black",
  "PyCQA/isort": "pypi:isort",
  "python-poetry/poetry": "pypi:poetry",

  // Rust CLI tools (crates)
  "BurntSushi/ripgrep": "crates:ripgrep",
  "sharkdp/bat": "crates:bat",
  "sharkdp/fd": "crates:fd-find",
  "sharkdp/hyperfine": "crates:hyperfine",
  "eza-community/eza": "crates:eza",
  "dandavison/delta": "crates:git-delta",
  "XAMPPRocky/tokei": "crates:tokei",
  "tomnomnom/gron": "crates:gron",
  "ducaale/xh": "crates:xh",
  "dbrgn/tealdeer": "crates:tealdeer",
  "watchexec/watchexec": "crates:watchexec-cli",
  "casey/just": "crates:just",
  "jdx/mise": "crates:mise",
  "ajeetdsouza/zoxide": "crates:zoxide",
  "ast-grep/ast-grep": "npm:@ast-grep/cli",

  // AI/ML Python packages (PyPI)
  "chroma-core/chroma": "pypi:chromadb",
  "lancedb/lancedb": "pypi:lancedb",
  "cleanlab/cleanlab": "pypi:cleanlab",
  "run-llama/llama_index": "pypi:llama-index",
  "Unstructured-IO/unstructured": "pypi:unstructured",
  "docling-project/docling": "pypi:docling",
  "stanfordnlp/dspy": "pypi:dspy-ai",
  "dottxt-ai/outlines": "pypi:outlines",
  "instructor-ai/instructor": "pypi:instructor",
  "guidance-ai/guidance": "pypi:guidance",
  "langchain-ai/langchain": "pypi:langchain",
  "langchain-ai/langgraph": "pypi:langgraph",
  "microsoft/autogen": "pypi:pyautogen",
  "danielmiessler/fabric": "pypi:fabric-ai",
  "optuna/optuna": "pypi:optuna",
  "PrefectHQ/prefect": "pypi:prefect",
  "dagster-io/dagster": "pypi:dagster",
  "iterative/dvc": "pypi:dvc",
  "iterative/cml": "pypi:cml",
  "neptune-ai/neptune-client": "pypi:neptune",
  "allegroai/clearml": "pypi:clearml",
  "great-expectations/great_expectations": "pypi:great-expectations",
  "ultralytics/ultralytics": "pypi:ultralytics",
  "pola-rs/polars": "pypi:polars",
  "streamlit/streamlit": "pypi:streamlit",
  "evidentlyai/evidently": "pypi:evidently",
  "nltk/nltk": "pypi:nltk",
  "piskvorky/gensim": "pypi:gensim",
  "openai/whisper": "pypi:openai-whisper",
  "openai/tiktoken": "pypi:tiktoken",
  "serengil/deepface": "pypi:deepface",
  "JaidedAI/EasyOCR": "pypi:easyocr",
  "qdrant/fastembed": "pypi:fastembed",
  "UKPLab/sentence-transformers": "pypi:sentence-transformers",
  "microsoft/onnxruntime": "pypi:onnxruntime",
  "microsoft/DeepSpeed": "pypi:deepspeed",
  "microsoft/presidio": "pypi:presidio-analyzer",
  "microsoft/graphrag": "pypi:graphrag",
  "guardrails-ai/guardrails": "pypi:guardrails-ai",
  "neuml/txtai": "pypi:txtai",
  "pydantic/pydantic-ai": "pypi:pydantic-ai",
  "confident-ai/deepeval": "pypi:deepeval",
  "explodinggradients/ragas": "pypi:ragas",
  "huggingface/trl": "pypi:trl",
  "huggingface/peft": "pypi:peft",
  "huggingface/optimum": "pypi:optimum",
  "huggingface/safetensors": "pypi:safetensors",
  "huggingface/huggingface_hub": "pypi:huggingface-hub",
  "huggingface/smolagents": "pypi:smolagents",
  "unslothai/unsloth": "pypi:unsloth",
  "axolotl-ai-cloud/axolotl": "pypi:axolotl",
  "scikit-learn/scikit-learn": "pypi:scikit-learn",
  "dmlc/xgboost": "pypi:xgboost",
  "microsoft/LightGBM": "pypi:lightgbm",
  "catboost/catboost": "pypi:catboost",
  "keras-team/keras": "pypi:keras",
  "fastapi/typer": "pypi:typer",
  "pallets/click": "pypi:click",
  "TheR1D/shell_gpt": "pypi:shell-gpt",
  "simonw/llm": "pypi:llm",
  "OpenInterpreter/open-interpreter": "pypi:open-interpreter",
  "mem0ai/mem0": "pypi:mem0ai",
  "modal-labs/modal-client": "pypi:modal",
  "skypilot-org/skypilot": "pypi:skypilot",
  "wookayin/gpustat": "pypi:gpustat",
  "joke2k/faker": "pypi:faker",
  "marimo-team/marimo": "pypi:marimo",
  "pycaret/pycaret": "pypi:pycaret",
  "kornia/kornia": "pypi:kornia",
  "replicate/replicate-python": "pypi:replicate",
  "jsvine/pdfplumber": "pypi:pdfplumber",
  "pymupdf/PyMuPDF": "pypi:pymupdf",
  "InternLM/lmdeploy": "pypi:lmdeploy",
  "sgl-project/sglang": "pypi:sglang",
  "abetlen/llama-cpp-python": "pypi:llama-cpp-python",
  "EleutherAI/lm-evaluation-harness": "pypi:lm-eval",
  "Arize-ai/phoenix": "pypi:arize-phoenix",
  "feast-dev/feast": "pypi:feast",
  "sodadata/soda-core": "pypi:soda-core",
  "ComposioHQ/composio": "pypi:composio-core",
  "unclecode/crawl4ai": "pypi:crawl4ai",
  "mendableai/firecrawl": "pypi:firecrawl-py",
  "Significant-Gravitas/AutoGPT": "pypi:autogpt",
  "geekan/MetaGPT": "pypi:metagpt",

  // npm CLI tools
  "vercel/turbo": "npm:turbo",
  "evanw/esbuild": "npm:esbuild",
  "nicolo-ribaudo/biome": "npm:@biomejs/biome",
  "n8n-io/n8n": "npm:n8n",
  "FlowiseAI/Flowise": "npm:flowise",
  "mastra-ai/mastra": "npm:mastra",
  "firebase/genkit": "npm:@genkit-ai/core",
  "triggerdotdev/trigger.dev": "npm:@trigger.dev/sdk",
};

/** Format a curated tool's source into a prefixed source string for the resolver. */
function formatSource(meta: CliTool): string {
  // Check override map for GitHub tools that have package manager releases
  if (meta.sourceType === "github") {
    const override = GITHUB_TO_PKG[meta.source];
    if (override) return override;
  }

  switch (meta.sourceType) {
    case "local": return meta.source;
    case "npm": return meta.source.startsWith("@") ? meta.source : `npm:${meta.source}`;
    case "pypi": return `pypi:${meta.source}`;
    case "crates": return `crates:${meta.source}`;
    case "github": return meta.source;
    default: {
      // Exhaustiveness check — compile error if a new sourceType is added without handling
      meta.sourceType satisfies never;
      return meta.source;
    }
  }
}

export async function curatedMode(args: CliArgs, startTime: number): Promise<void> {
  const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  const allTools = loadAllTools(projectRoot);

  if (!existsSync(join(projectRoot, "examples", "data", "ai-ml-tools.json"))) {
    log("  Warning: ai-ml-tools.json not found — only general tools loaded.");
  }

  if (args.listCategories) {
    const cats = new Map<string, number>();
    for (const t of allTools) {
      cats.set(t.category, (cats.get(t.category) ?? 0) + 1);
    }
    log(`\n  ${allTools.length} tools across ${cats.size} categories:\n`);
    const sorted = [...cats.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    for (const [cat, count] of sorted) {
      log(`    ${cat.padEnd(35)} ${count} tools`);
    }
    log(`\n  Filter with: --category <name>  (partial match, e.g. "ai-ml" or "security")\n`);
    if (args.json) {
      emit(success("skill-forge:curated", {
        total: allTools.length,
        categories: Object.fromEntries(sorted),
      }, startTime), true);
    }
    return;
  }

  let tools = allTools;
  if (args.category) {
    tools = tools.filter(t => t.category.toLowerCase().includes(args.category));
  }
  if (args.limit > 0) {
    tools = tools.slice(0, args.limit);
  }

  log(`  Mode:     curated`);
  log(`  Tools:    ${tools.length} / ${allTools.length}`);
  if (args.category) log(`  Category: ${args.category}`);
  log(`  Dry run:  ${args.dryRun}`);
  log("");

  const categories = new Map<string, CliTool[]>();
  for (const t of tools) {
    if (!categories.has(t.category)) categories.set(t.category, []);
    categories.get(t.category)!.push(t);
  }

  for (const [cat, catTools] of categories) {
    log(`  ${cat} (${catTools.length})`);
    for (const t of catTools) {
      const srcLabel = formatSource(t);
      log(`    ${t.name.padEnd(16)} ${srcLabel.padEnd(35)} ${t.description.slice(0, 50)}`);
    }
    log("");
  }

  if (args.dryRun) {
    log(`  Dry run complete. ${tools.length} tools would be processed.`);
    if (args.json) {
      emit(success("skill-forge:curated", {
        tools: tools.map(t => ({ name: t.name, source: t.source, category: t.category })),
        total: tools.length,
      }, startTime), true);
    }
    return;
  }

  const skipped: CliTool[] = [];
  const toProcess: CliTool[] = [];
  for (const meta of tools) {
    if (args.skipInstalled && existsSync(join(OUTPUT_DIR, meta.name, "SKILL.md"))) {
      log(`  Skipping ${meta.name} (already has SKILL.md)`);
      skipped.push(meta);
    } else {
      toProcess.push(meta);
    }
  }

  const metaMap = new Map(toProcess.map(m => [m.name, m]));
  const batchItems: BatchItem[] = toProcess.map(meta => ({
    label: meta.name,
    source: formatSource(meta),
    curatedMeta: {
      description: meta.description,
      agentValue: meta.agentValue,
      category: meta.category,
    },
  }));

  const checkpointPath = args.resume || join(OUTPUT_DIR, `.checkpoint-curated-${Date.now()}.jsonl`);
  const onProgress = args.json ? (label: string, completed: number, total: number, result: import("./types.js").BatchResult | null) => {
    process.stdout.write(JSON.stringify({
      type: "progress", label, status: result ? "ok" : "fail",
      progress: `${completed}/${total}`, timestamp: new Date().toISOString(),
    }) + "\n");
  } : undefined;

  const { results, failures } = await processBatch(batchItems, {
    deep: args.deep,
    noCache: args.noCache,
    force: args.force,
    timeout: args.timeout,
    concurrency: args.concurrency,
    checkpointPath,
    resumeFrom: args.resume || undefined,
    onProgress,
  });

  if (results.length > 0 && !args.noIndex) {
    log("\n  Building indexes...");
    await buildIndexes(results.map(r => r.tool), false);
  } else if (args.noIndex) {
    log("\n  Skipping index build (--no-index). Run --index separately after batch completes.");
  }

  log("\n  ═══════════════════════════════════════════════════════");
  log("  Curated Pipeline Summary");
  log("  ═══════════════════════════════════════════════════════");
  log(`  Processed: ${results.length} | Failed: ${failures.length} | Skipped: ${skipped.length}`);

  if (results.length > 0) {
    const rows = results.map(r => {
      const meta = metaMap.get(r.label);
      return [
        r.tool.meta.name.slice(0, 25),
        meta?.category ?? "",
        `${r.tool.capabilities.commands.length}`,
        r.quality.triggerScore.toFixed(2),
        r.quality.passed ? "PASS" : "FAIL",
      ];
    });
    log(fmtTable(rows, ["Skill", "Category", "Cmds", "Trigger", "Status"]));
  }

  if (args.json) {
    emit(success("skill-forge:curated", {
      processed: results.length,
      failed: failures.length,
      skipped: skipped.length,
      results: results.map(r => ({
        name: r.tool.meta.name,
        category: metaMap.get(r.label)?.category ?? "",
        commands: r.tool.capabilities.commands.length,
        quality: r.quality,
      })),
    }, startTime), true);
  }
}
