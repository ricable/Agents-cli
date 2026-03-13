/**
 * cli-anything/harness-generator.ts — Phase 2 (Design) + Phase 3 (Implement).
 *
 * Generates a Click-based Python CLI harness from an AppProfile.
 * Produces: pyproject.toml, __init__.py, cli.py, backend.py, output.py
 * All harnesses depend on cli-anything-core for shared REPL, JSON output, testing.
 */

import type {
  AppProfile,
  HarnessDesign,
  HarnessBundle,
  HarnessFile,
  CommandDesign,
  ReplConfig,
} from "./types.js";
import { getAppEntry } from "./registry.js";

// ── Phase 2: Design ────────────────────────────────────────────────────

/**
 * Design the CLI harness structure from an AppProfile.
 */
export function designHarness(profile: AppProfile): HarnessDesign {
  const packageName = `cli-anything-${profile.name}`;
  const groups = [...new Set(profile.apiSurface.map(e => e.group))];

  const commands: CommandDesign[] = profile.apiSurface.map(endpoint => ({
    name: endpoint.name.replace(/_/g, "-"),
    group: endpoint.group,
    description: endpoint.description,
    args: endpoint.args.map(a => ({
      name: a.name,
      type: a.type,
      required: a.required,
      description: a.description,
    })),
    returnSchema: { ok: "boolean", command: "string", data: "object" },
  }));

  const replConfig: ReplConfig = {
    banner: `${profile.displayName} CLI v{version} — type 'help' for commands`,
    prompt: `${profile.name}> `,
    historyFile: `.${profile.name}_history`,
    undoSupport: profile.category === "creative",
  };

  return {
    packageName,
    commands,
    groups,
    replConfig,
    outputSchema: {
      ok: "boolean",
      command: "string",
      data: "object",
      meta: { version: "string", duration: "number", timestamp: "string" },
    },
  };
}

// ── Phase 3: Implement ─────────────────────────────────────────────────

/**
 * Generate the full Click-based harness bundle.
 */
export function implementHarness(profile: AppProfile, design: HarnessDesign): HarnessBundle {
  const pkg = design.packageName.replace(/-/g, "_");
  const files: HarnessFile[] = [];

  // pyproject.toml
  files.push({
    path: "pyproject.toml",
    content: generatePyproject(design, profile),
  });

  // Package __init__.py
  files.push({
    path: `${pkg}/__init__.py`,
    content: `"""${profile.displayName} CLI harness — agent-native CLI wrapper."""\n__version__ = "0.1.0"\n`,
  });

  // output.py — JSON output helpers (uses cli-anything-core)
  files.push({
    path: `${pkg}/output.py`,
    content: generateOutputPy(profile),
  });

  // backend.py — App-specific backend
  files.push({
    path: `${pkg}/backend.py`,
    content: generateBackendPy(profile),
  });

  // cli.py — Click CLI entry point
  files.push({
    path: `${pkg}/cli.py`,
    content: generateCliPy(profile, design),
  });

  // conftest.py — pytest configuration
  files.push({
    path: "tests/__init__.py",
    content: "",
  });

  files.push({
    path: "tests/conftest.py",
    content: generateConftest(design),
  });

  // README.md
  files.push({
    path: "README.md",
    content: generateReadme(profile, design),
  });

  return {
    packageName: design.packageName,
    files,
    design,
    profile,
    entryPoint: `${pkg}/cli.py`,
  };
}

// ── Code generators ────────────────────────────────────────────────────

function generatePyproject(design: HarnessDesign, profile: AppProfile): string {
  const pkg = design.packageName.replace(/-/g, "_");
  const deps = profile.bindings.length > 0
    ? profile.bindings.map(b => `    "${b}",`).join("\n")
    : '    # No specific bindings required';

  return `[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "${design.packageName}"
version = "0.1.0"
description = "Agent-native CLI wrapper for ${profile.displayName}"
readme = "README.md"
requires-python = ">=3.10"
license = "MIT"
dependencies = [
    "click>=8.0",
    "cli-anything-core>=0.1.0",
${deps}
]

[project.scripts]
${design.packageName} = "${pkg}.cli:main"

[tool.pytest.ini_options]
markers = [
    "unit: Unit tests (no app required)",
    "integration: Integration tests (app required)",
    "e2e: End-to-end tests",
    "docker: Docker-based tests",
]
`;
}

function generateOutputPy(profile: AppProfile): string {
  return `"""${profile.displayName} — JSON output helpers.

Uses cli-anything-core superset format:
  {ok: bool, command: str, data: dict, meta: {version, duration, timestamp}}
"""
from cli_anything_core.output import json_response, error_response

__all__ = ["json_response", "error_response"]
`;
}

function generateBackendPy(profile: AppProfile): string {
  const entry = getAppEntry(profile.name);
  const bindingImports = profile.bindings
    .filter(b => !b.includes("."))
    .map(b => `    import ${b.replace(/-/g, "_")}  # noqa: F401`)
    .join("\n");

  let backendBody: string;

  switch (profile.backendType) {
    case "python-binding":
      backendBody = `
class ${capitalize(profile.name)}Backend:
    """Backend using Python bindings for ${profile.displayName}."""

    def __init__(self):
        self._check_bindings()

    def _check_bindings(self):
        \"\"\"Verify required bindings are available.\"\"\"
        try:
${bindingImports || '            pass'}
            self.available = True
        except ImportError:
            self.available = False

    def execute(self, group: str, action: str, **kwargs) -> dict:
        \"\"\"Execute a command via Python bindings.\"\"\"
        method = getattr(self, f"{group}_{action}", None)
        if method is None:
            return {"error": f"Unknown command: {group}.{action}"}
        return method(**kwargs)
`;
      break;

    case "subprocess":
      backendBody = `
import subprocess
import shlex

class ${capitalize(profile.name)}Backend:
    \"\"\"Backend using subprocess calls for ${profile.displayName}.\"\"\"

    def __init__(self, binary: str = "${entry?.binaries[0] ?? profile.name}"):
        self.binary = binary
        self.available = self._check_binary()

    def _check_binary(self) -> bool:
        \"\"\"Check if the binary is available.\"\"\"
        try:
            subprocess.run([self.binary, "--version"], capture_output=True, timeout=5)
            return True
        except (FileNotFoundError, subprocess.TimeoutExpired):
            return False

    def execute(self, group: str, action: str, **kwargs) -> dict:
        \"\"\"Execute a command via subprocess.\"\"\"
        method = getattr(self, f"{group}_{action}", None)
        if method is None:
            return {"error": f"Unknown command: {group}.{action}"}
        return method(**kwargs)

    def _run(self, args: list[str], timeout: int = 30) -> dict:
        \"\"\"Run a subprocess and return structured output.\"\"\"
        try:
            result = subprocess.run(
                [self.binary] + args,
                capture_output=True, text=True, timeout=timeout,
            )
            return {"stdout": result.stdout, "stderr": result.stderr, "returncode": result.returncode}
        except subprocess.TimeoutExpired:
            return {"error": f"Command timed out after {timeout}s"}
        except FileNotFoundError:
            return {"error": f"Binary not found: {self.binary}"}
`;
      break;

    case "rest-api":
      backendBody = `
import urllib.request
import json as _json

class ${capitalize(profile.name)}Backend:
    \"\"\"Backend using REST API for ${profile.displayName}.\"\"\"

    def __init__(self, base_url: str = "http://localhost:8080", token: str = ""):
        self.base_url = base_url
        self.token = token
        self.available = True

    def execute(self, group: str, action: str, **kwargs) -> dict:
        \"\"\"Execute a command via REST API.\"\"\"
        method = getattr(self, f"{group}_{action}", None)
        if method is None:
            return {"error": f"Unknown command: {group}.{action}"}
        return method(**kwargs)

    def _request(self, method: str, path: str, data: dict | None = None) -> dict:
        \"\"\"Make an API request.\"\"\"
        url = f"{self.base_url}{path}"
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        body = _json.dumps(data).encode() if data else None
        req = urllib.request.Request(url, data=body, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return _json.loads(resp.read())
        except Exception as e:
            return {"error": str(e)}
`;
      break;

    default:
      backendBody = `
class ${capitalize(profile.name)}Backend:
    \"\"\"Generic backend for ${profile.displayName}.\"\"\"

    def __init__(self):
        self.available = True

    def execute(self, group: str, action: str, **kwargs) -> dict:
        \"\"\"Execute a command.\"\"\"
        method = getattr(self, f"{group}_{action}", None)
        if method is None:
            return {"error": f"Unknown command: {group}.{action}"}
        return method(**kwargs)
`;
  }

  // Add stub methods for each API group
  const groupMethods = (entry?.apiGroups ?? []).map(group => `
    def ${group}_list(self, **kwargs) -> dict:
        \"\"\"List ${group} items.\"\"\"
        return {"items": [], "count": 0}

    def ${group}_create(self, **kwargs) -> dict:
        \"\"\"Create a ${group} item.\"\"\"
        return {"created": True, "id": "new"}

    def ${group}_get(self, id: str = "", **kwargs) -> dict:
        \"\"\"Get a ${group} item by ID.\"\"\"
        return {"id": id}
`).join("");

  return `\"\"\"${profile.displayName} backend — ${profile.backendType} interface.\"\"\"
${backendBody}
${groupMethods}
`;
}

function generateCliPy(profile: AppProfile, design: HarnessDesign): string {
  const pkg = design.packageName.replace(/-/g, "_");
  const groupBlocks = design.groups.map(group => {
    const cmds = design.commands.filter(c => c.group === group);
    const cmdDefs = cmds.map(cmd => {
      const argDefs = cmd.args
        .map(a => a.required
          ? `@click.argument("${a.name}")`
          : `@click.option("--${a.name}", default=None, help="${a.description}")`)
        .join("\n");
      const argParams = cmd.args.map(a => a.name).join(", ");
      return `
@${group}.command(name="${cmd.name.replace(`${group}-`, "")}")
${argDefs}
@click.pass_context
def ${cmd.name.replace(/-/g, "_")}(ctx, ${argParams}):
    \"\"\"${cmd.description}\"\"\"
    result = ctx.obj["backend"].execute("${group}", "${cmd.name.split("-").pop()}", ${cmd.args.map(a => `${a.name}=${a.name}`).join(", ")})
    if ctx.obj.get("json"):
        click.echo(json_response("${cmd.name}", result))
    else:
        click.echo(result)
`;
    }).join("");

    return `
@cli.group()
@click.pass_context
def ${group}(ctx):
    \"\"\"${capitalize(group)} operations.\"\"\"
    pass
${cmdDefs}
`;
  }).join("");

  return `\"\"\"${profile.displayName} CLI — Click-based agent-native wrapper.\"\"\"
import click
from cli_anything_core.output import json_response, error_response
from ${pkg}.backend import ${capitalize(profile.name)}Backend

__version__ = "0.1.0"


@click.group()
@click.version_option(__version__, prog_name="${design.packageName}")
@click.option("--json", "use_json", is_flag=True, help="Output structured JSON")
@click.option("--verbose", is_flag=True, help="Enable verbose logging")
@click.pass_context
def cli(ctx, use_json, verbose):
    \"\"\"${profile.displayName} CLI — agent-native wrapper for ${profile.displayName}.\"\"\"
    ctx.ensure_object(dict)
    ctx.obj["json"] = use_json
    ctx.obj["verbose"] = verbose
    ctx.obj["backend"] = ${capitalize(profile.name)}Backend()

${groupBlocks}

def main():
    cli()

if __name__ == "__main__":
    main()
`;
}

function generateConftest(design: HarnessDesign): string {
  return `\"\"\"Shared pytest fixtures for ${design.packageName}.\"\"\"
import pytest
from click.testing import CliRunner


@pytest.fixture
def runner():
    \"\"\"Click CLI test runner.\"\"\"
    return CliRunner()


@pytest.fixture
def json_runner(runner):
    \"\"\"Runner that always passes --json.\"\"\"
    class JsonRunner:
        def invoke(self, cli, args=None, **kwargs):
            full_args = ["--json"] + (args or [])
            return runner.invoke(cli, full_args, **kwargs)
    return JsonRunner()
`;
}

function generateReadme(profile: AppProfile, design: HarnessDesign): string {
  const cmdList = design.groups.map(g =>
    `- \`${design.packageName} ${g}\` — ${capitalize(g)} operations`
  ).join("\n");

  return `# ${design.packageName}

Agent-native CLI wrapper for **${profile.displayName}** with structured JSON output.

## Install

\`\`\`bash
uv pip install -e .
\`\`\`

## Usage

\`\`\`bash
# Show help
${design.packageName} --help

# JSON output mode
${design.packageName} --json ${design.groups[0] ?? "help"} list

# Version
${design.packageName} --version
\`\`\`

## Command Groups

${cmdList}

## JSON Output Format

All commands support \`--json\` for structured output:

\`\`\`json
{
  "ok": true,
  "command": "...",
  "data": { ... },
  "meta": {
    "version": "0.1.0",
    "duration": 0.123,
    "timestamp": "2025-01-01T00:00:00Z"
  }
}
\`\`\`

## Backend: ${profile.backendType}

${profile.bindings.length > 0 ? `Uses: ${profile.bindings.join(", ")}` : "Generic subprocess backend."}

## License

MIT
`;
}

// ── Helpers ────────────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
}
