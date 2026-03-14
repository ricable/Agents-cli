/**
 * agent-analyzer.ts — Pure TypeScript regex/heuristic parser for agent scripts.
 *
 * Analyzes .py/.ts/.js/.sh files via text parsing (no AST, no Python runtime).
 * Extracts imports, env vars, file I/O, SDK calls, entry points, and
 * cross-script dependencies to enable workflow manifest inference.
 */

import { readFileSync, readdirSync, statSync, type Dirent } from "node:fs";
import { join, extname } from "node:path";
import { rejectPathTraversal } from "../guards.js";

// ── Types ──────────────────────────────────────────────────────────────

export interface AgentAnalysis {
  imports: string[];
  envVars: string[];
  fileInputs: string[];
  fileOutputs: string[];
  sdkCalls: Array<{ sdk: string; method: string; line: number }>;
  entryPoints: string[];
  crossScriptDeps: string[];
  language: "python" | "typescript" | "javascript" | "shell" | "unknown";
}

// ── Known SDK patterns ─────────────────────────────────────────────────

const SDK_MAP: Record<string, string> = {
  openai: "openai",
  anthropic: "anthropic",
  langchain: "langchain",
  "langchain_core": "langchain",
  "langchain_openai": "langchain",
  "langchain_community": "langchain",
  transformers: "transformers",
  torch: "pytorch",
  tensorflow: "tensorflow",
  "google.generativeai": "google-genai",
  "google.cloud": "google-cloud",
  requests: "requests",
  httpx: "httpx",
  aiohttp: "aiohttp",
  fastapi: "fastapi",
  flask: "flask",
  gradio: "gradio",
  streamlit: "streamlit",
  pydantic: "pydantic",
  PIL: "pillow",
  cv2: "opencv",
  numpy: "numpy",
  pandas: "pandas",
  scipy: "scipy",
  sklearn: "scikit-learn",
  replicate: "replicate",
  stability_sdk: "stability-ai",
  elevenlabs: "elevenlabs",
  boto3: "aws-sdk",
  supabase: "supabase",
  pinecone: "pinecone",
  chromadb: "chromadb",
  weaviate: "weaviate",
  qdrant_client: "qdrant",
  cohere: "cohere",
  mistralai: "mistral",
  groq: "groq",
  together: "together-ai",
};

/** Map SDK to its typical env var */
const SDK_ENV_MAP: Record<string, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  "google-genai": "GEMINI_API_KEY",
  "google-cloud": "GOOGLE_APPLICATION_CREDENTIALS",
  replicate: "REPLICATE_API_TOKEN",
  "stability-ai": "STABILITY_API_KEY",
  elevenlabs: "ELEVENLABS_API_KEY",
  "aws-sdk": "AWS_ACCESS_KEY_ID",
  pinecone: "PINECONE_API_KEY",
  cohere: "COHERE_API_KEY",
  mistral: "MISTRAL_API_KEY",
  groq: "GROQ_API_KEY",
  "together-ai": "TOGETHER_API_KEY",
  supabase: "SUPABASE_URL",
};

// ── Skip patterns ──────────────────────────────────────────────────────

const SKIP_DIRS = new Set([
  "__pycache__", ".venv", "venv", ".env", "node_modules",
  ".git", ".mypy_cache", ".pytest_cache", ".ruff_cache",
  "dist", "build", ".tox", ".nox", "egg-info",
]);

const VALID_EXTENSIONS = new Set([".py", ".ts", ".js", ".sh", ".bash"]);

// ── Language detection ─────────────────────────────────────────────────

function detectLanguage(filePath: string): AgentAnalysis["language"] {
  const ext = extname(filePath).toLowerCase();
  switch (ext) {
    case ".py": return "python";
    case ".ts": return "typescript";
    case ".js": return "javascript";
    case ".sh": case ".bash": return "shell";
    default: return "unknown";
  }
}

// ── Python analysis ────────────────────────────────────────────────────

function analyzePython(_content: string, lines: string[]): Omit<AgentAnalysis, "language"> {
  const imports: string[] = [];
  const envVars: string[] = [];
  const fileInputs: string[] = [];
  const fileOutputs: string[] = [];
  const sdkCalls: AgentAnalysis["sdkCalls"] = [];
  const entryPoints: string[] = [];
  const crossScriptDeps: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (trimmed.startsWith("#") || trimmed === "") continue;

    // ── Imports ──
    const fromImport = trimmed.match(/^from\s+([\w.]+)\s+import\s+(.+)/);
    if (fromImport) {
      const mod = fromImport[1]!;
      imports.push(mod);
      // Cross-script deps: local imports (no dots in module, not a known package)
      if (!mod.includes(".") && !SDK_MAP[mod] && !/^(os|sys|json|re|pathlib|datetime|typing|collections|functools|itertools|subprocess|argparse|logging|time|random|copy|math|glob|shutil|tempfile|textwrap|io|abc|enum|dataclasses|contextlib|unittest|asyncio|concurrent|multiprocessing|threading|socket|http|urllib|base64|hashlib|secrets|uuid|csv|configparser|xml|html)$/.test(mod)) {
        crossScriptDeps.push(mod);
      }
    }
    const directImport = trimmed.match(/^import\s+([\w.]+)/);
    if (directImport && !fromImport) {
      imports.push(directImport[1]!);
    }

    // ── Env vars ──
    const envPatterns = [
      /os\.environ\["([^"]+)"\]/g,
      /os\.environ\['([^']+)'\]/g,
      /os\.getenv\(["']([^"']+)["']/g,
      /os\.environ\.get\(["']([^"']+)["']/g,
    ];
    for (const pat of envPatterns) {
      pat.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = pat.exec(line)) !== null) {
        envVars.push(m[1]!);
      }
    }

    // ── File I/O ──
    const openRead = line.match(/open\(["']([^"']+)["']\s*(?:,\s*["']r["'])?\)/);
    if (openRead) fileInputs.push(openRead[1]!);
    const openWrite = line.match(/open\(["']([^"']+)["']\s*,\s*["'][wa]["']/);
    if (openWrite) fileOutputs.push(openWrite[1]!);
    if (/\.read_text\(/.test(line)) {
      const pathMatch = line.match(/Path\(["']([^"']+)["']\)/);
      if (pathMatch) fileInputs.push(pathMatch[1]!);
    }
    if (/\.write_text\(/.test(line)) {
      const pathMatch = line.match(/Path\(["']([^"']+)["']\)/);
      if (pathMatch) fileOutputs.push(pathMatch[1]!);
    }
    if (/pd\.read_csv\(/.test(line)) {
      const csvMatch = line.match(/pd\.read_csv\(["']([^"']+)["']/);
      if (csvMatch) fileInputs.push(csvMatch[1]!);
    }
    if (/json\.load\(/.test(line)) fileInputs.push("(json input)");
    if (/json\.dump\(/.test(line)) fileOutputs.push("(json output)");
    if (/\.to_csv\(/.test(line)) fileOutputs.push("(csv output)");

    // ── SDK calls ──
    for (const [pkg, sdk] of Object.entries(SDK_MAP)) {
      if (line.includes(pkg)) {
        const methodMatch = line.match(new RegExp(`${pkg.replace(/\./g, "\\.")}\\.(\\w+)`));
        if (methodMatch) {
          sdkCalls.push({ sdk, method: methodMatch[1]!, line: i + 1 });
        }
      }
    }
    // Special: client.chat.completions.create pattern
    if (/\.chat\.completions\.create/.test(line)) {
      sdkCalls.push({ sdk: "openai", method: "chat.completions.create", line: i + 1 });
    }
    if (/\.messages\.create/.test(line)) {
      sdkCalls.push({ sdk: "anthropic", method: "messages.create", line: i + 1 });
    }
    if (/generate_content/.test(line)) {
      sdkCalls.push({ sdk: "google-genai", method: "generate_content", line: i + 1 });
    }

    // ── Entry points ──
    if (/^if\s+__name__\s*==\s*["']__main__["']/.test(trimmed)) {
      entryPoints.push("__main__");
    }
    if (/^def\s+main\s*\(/.test(trimmed)) entryPoints.push("main()");
    if (/@click\.command/.test(trimmed)) entryPoints.push("click.command");
    if (/app\s*=\s*FastAPI\(/.test(trimmed)) entryPoints.push("FastAPI");
    if (/argparse\.ArgumentParser/.test(trimmed)) entryPoints.push("argparse");
  }

  // Infer env vars from SDK usage
  const detectedSdks = new Set(sdkCalls.map(s => s.sdk));
  for (const sdk of detectedSdks) {
    const envVar = SDK_ENV_MAP[sdk];
    if (envVar && !envVars.includes(envVar)) {
      envVars.push(envVar);
    }
  }

  return {
    imports: [...new Set(imports)],
    envVars: [...new Set(envVars)],
    fileInputs: [...new Set(fileInputs)],
    fileOutputs: [...new Set(fileOutputs)],
    sdkCalls,
    entryPoints: [...new Set(entryPoints)],
    crossScriptDeps: [...new Set(crossScriptDeps)],
  };
}

// ── JavaScript/TypeScript analysis ─────────────────────────────────────

function analyzeJavaScript(_content: string, lines: string[]): Omit<AgentAnalysis, "language"> {
  const imports: string[] = [];
  const envVars: string[] = [];
  const fileInputs: string[] = [];
  const fileOutputs: string[] = [];
  const sdkCalls: AgentAnalysis["sdkCalls"] = [];
  const entryPoints: string[] = [];
  const crossScriptDeps: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed === "") continue;

    // ── Imports ──
    const esImport = trimmed.match(/^import\s+.*?from\s+["']([^"']+)["']/);
    if (esImport) imports.push(esImport[1]!);
    const requireMatch = trimmed.match(/require\(["']([^"']+)["']\)/);
    if (requireMatch) imports.push(requireMatch[1]!);

    // ── Env vars ──
    const envMatch = line.matchAll(/process\.env\.(\w+)|process\.env\["([^"]+)"\]|process\.env\['([^']+)'\]/g);
    for (const m of envMatch) {
      envVars.push(m[1] || m[2] || m[3]!);
    }

    // ── File I/O ──
    if (/readFileSync|readFile\(/.test(line)) {
      const fMatch = line.match(/(?:readFileSync|readFile)\(["']([^"']+)["']/);
      if (fMatch) fileInputs.push(fMatch[1]!);
    }
    if (/writeFileSync|writeFile\(/.test(line)) {
      const fMatch = line.match(/(?:writeFileSync|writeFile)\(["']([^"']+)["']/);
      if (fMatch) fileOutputs.push(fMatch[1]!);
    }

    // ── Entry points ──
    if (/^(?:export\s+)?(?:async\s+)?function\s+main\s*\(/.test(trimmed)) entryPoints.push("main()");
    if (/\.listen\(\d+/.test(trimmed)) entryPoints.push("server.listen");
  }

  return {
    imports: [...new Set(imports)],
    envVars: [...new Set(envVars)],
    fileInputs: [...new Set(fileInputs)],
    fileOutputs: [...new Set(fileOutputs)],
    sdkCalls,
    entryPoints: [...new Set(entryPoints)],
    crossScriptDeps: [...new Set(crossScriptDeps)],
  };
}

// ── Shell analysis ─────────────────────────────────────────────────────

function analyzeShell(_content: string, lines: string[]): Omit<AgentAnalysis, "language"> {
  const imports: string[] = [];
  const envVars: string[] = [];
  const fileInputs: string[] = [];
  const fileOutputs: string[] = [];
  const sdkCalls: AgentAnalysis["sdkCalls"] = [];
  const entryPoints: string[] = [];
  const crossScriptDeps: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();
    if (trimmed.startsWith("#") && !trimmed.startsWith("#!")) continue;
    if (trimmed === "") continue;

    // Shebang as entry point
    if (i === 0 && trimmed.startsWith("#!")) {
      entryPoints.push("shebang");
    }

    // ── Env vars ──
    const envRefs = line.matchAll(/\$\{?([A-Z][A-Z0-9_]+)\}?/g);
    for (const m of envRefs) {
      const v = m[1]!;
      // Skip common shell vars
      if (!/^(PATH|HOME|PWD|USER|SHELL|TERM|LANG|EDITOR|TMPDIR|HOSTNAME|OSTYPE|MACHTYPE|BASH_VERSION|ZSH_VERSION|IFS|PS1|PS2|OPTARG|OPTIND|RANDOM|SECONDS|LINENO|PIPESTATUS|FUNCNAME|BASH_SOURCE|BASH_LINENO|REPLY)$/.test(v)) {
        envVars.push(v);
      }
    }

    // ── File I/O (redirections) ──
    const inputRedir = line.match(/< ["']?([^\s"']+)["']?/);
    if (inputRedir) fileInputs.push(inputRedir[1]!);
    const outputRedir = line.match(/[12]?>+ ["']?([^\s"']+)["']?/);
    if (outputRedir) fileOutputs.push(outputRedir[1]!);

    // ── Script calls (cross-script deps) ──
    const sourceMatch = trimmed.match(/(?:source|\.)\s+["']?([^\s"']+)["']?/);
    if (sourceMatch) crossScriptDeps.push(sourceMatch[1]!);
    const bashMatch = trimmed.match(/(?:bash|sh|python3?)\s+["']?([^\s"']+\.(?:sh|py))["']?/);
    if (bashMatch) crossScriptDeps.push(bashMatch[1]!);
  }

  return {
    imports: [...new Set(imports)],
    envVars: [...new Set(envVars)],
    fileInputs: [...new Set(fileInputs)],
    fileOutputs: [...new Set(fileOutputs)],
    sdkCalls,
    entryPoints: [...new Set(entryPoints)],
    crossScriptDeps: [...new Set(crossScriptDeps)],
  };
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Analyze a single agent script file.
 */
export function analyzeAgentScript(filePath: string): AgentAnalysis {
  rejectPathTraversal(filePath, "agent script path");

  const ext = extname(filePath).toLowerCase();
  if (!VALID_EXTENSIONS.has(ext)) {
    return {
      imports: [], envVars: [], fileInputs: [], fileOutputs: [],
      sdkCalls: [], entryPoints: [], crossScriptDeps: [],
      language: "unknown",
    };
  }

  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const language = detectLanguage(filePath);

  let analysis: Omit<AgentAnalysis, "language">;
  switch (language) {
    case "python":
      analysis = analyzePython(content, lines);
      break;
    case "typescript":
    case "javascript":
      analysis = analyzeJavaScript(content, lines);
      break;
    case "shell":
      analysis = analyzeShell(content, lines);
      break;
    default:
      analysis = {
        imports: [], envVars: [], fileInputs: [], fileOutputs: [],
        sdkCalls: [], entryPoints: [], crossScriptDeps: [],
      };
  }

  return { ...analysis, language };
}

/**
 * Analyze all agent scripts in a directory.
 * Skips __pycache__, .venv, node_modules, .git, etc.
 */
export function analyzeAgentDirectory(dirPath: string): Map<string, AgentAnalysis> {
  rejectPathTraversal(dirPath, "agent directory path");

  const results = new Map<string, AgentAnalysis>();

  function walk(dir: string): void {
    let entries: Dirent<string>[];
    try {
      entries = readdirSync(dir, { withFileTypes: true, encoding: "utf-8" }) as Dirent<string>[];
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        walk(join(dir, entry.name));
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if (!VALID_EXTENSIONS.has(ext)) continue;
        const fullPath = join(dir, entry.name);
        try {
          const stat = statSync(fullPath);
          // Skip files > 1MB
          if (stat.size > 1_048_576) continue;
        } catch {
          continue;
        }
        results.set(entry.name, analyzeAgentScript(fullPath));
      }
    }
  }

  walk(dirPath);
  return results;
}

export { SDK_ENV_MAP };
