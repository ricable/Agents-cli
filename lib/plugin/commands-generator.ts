/**
 * plugin/commands-generator.ts — Generate 8 user-invokable commands per plugin.
 *
 * Produces markdown command files conforming to Claude Code plugin spec:
 *   commands/<name>.md with YAML frontmatter + instructions
 *
 * Commands: search, list, setup, status, audit, run, team, update
 */

import type { ManifestEntry } from "../types.js";

export interface GeneratedCommand {
  /** Filename (e.g. "search.md") */
  filename: string;
  /** Full markdown content */
  content: string;
}

/**
 * Generate all 8 commands for a domain plugin.
 */
export function generatePluginCommands(
  domain: string,
  entries: ManifestEntry[],
): GeneratedCommand[] {
  const toolNames = entries.map(e => e.name);
  const toolList = toolNames.join(", ");
  const toolBullets = entries.map(e => `- **${e.name}**: ${e.description || "CLI tool"}`).join("\n");

  return [
    generateSearchCommand(domain, toolList),
    generateListCommand(domain, entries, toolBullets),
    generateSetupCommand(domain, entries),
    generateStatusCommand(domain, toolNames),
    generateAuditCommand(domain, toolNames),
    generateRunCommand(domain, toolNames),
    generateTeamCommand(domain, toolNames),
    generateUpdateCommand(domain, toolNames),
  ];
}

function generateSearchCommand(domain: string, toolList: string): GeneratedCommand {
  return {
    filename: "search.md",
    content: [
      "---",
      `description: Search ${domain} tools and documentation. Use when looking for ${domain} commands, flags, or usage patterns.`,
      "---",
      "",
      `Search across ${domain} domain tools for the query "$ARGUMENTS".`,
      "",
      `Available tools in this domain: ${toolList}`,
      "",
      "Steps:",
      "1. Identify which tools are relevant to the query",
      "2. Search skill documentation using Grep for matching commands, flags, and examples",
      "3. Return concise, actionable results with concrete command examples",
      "",
    ].join("\n"),
  };
}

function generateListCommand(domain: string, entries: ManifestEntry[], toolBullets: string): GeneratedCommand {
  return {
    filename: "list.md",
    content: [
      "---",
      `description: List all ${domain} tools available in this plugin`,
      "disable-model-invocation: true",
      "---",
      "",
      `# ${domain} tools`,
      "",
      `This plugin provides ${entries.length} tools:`,
      "",
      toolBullets,
      "",
    ].join("\n"),
  };
}

function generateSetupCommand(domain: string, entries: ManifestEntry[]): GeneratedCommand {
  return {
    filename: "setup.md",
    content: [
      "---",
      `description: Install and configure all ${domain} domain tools. Use when setting up a new environment for ${domain} development.`,
      "context: fork",
      "---",
      "",
      `Set up the ${domain} development environment by:`,
      "",
      `1. Check which ${domain} tools are already installed`,
      `2. For each missing tool, read its skill's scripts/install.sh and execute it`,
      "3. Verify each tool works by running its --version or --help command",
      "4. Report installation status for all tools",
      "",
      `Tools to install: ${entries.map(e => e.name).join(", ")}`,
      "",
      "If $ARGUMENTS specifies a subset of tools, only set up those.",
      "",
    ].join("\n"),
  };
}

function generateStatusCommand(domain: string, toolNames: string[]): GeneratedCommand {
  return {
    filename: "status.md",
    content: [
      "---",
      `description: Show status of ${domain} tools, hooks, and agents. Use when checking environment health.`,
      "disable-model-invocation: true",
      "---",
      "",
      `Check and report the status of the ${domain} domain:`,
      "",
      "1. **Tool versions**: For each tool, run `<tool> --version` and report",
      "2. **Hook status**: Check if hooks.json exists and list active hooks",
      "3. **Agent availability**: List available domain agents",
      "4. **Project detection**: Check for relevant config files",
      "",
      `Tools: ${toolNames.join(", ")}`,
      "",
    ].join("\n"),
  };
}

function generateAuditCommand(domain: string, _toolNames: string[]): GeneratedCommand {
  return {
    filename: "audit.md",
    content: [
      "---",
      `description: Run quality audit on ${domain} domain skills and configuration. Use when validating plugin health.`,
      "context: fork",
      "---",
      "",
      `Audit the ${domain} domain plugin:`,
      "",
      "1. Verify all skill SKILL.md files have valid frontmatter",
      "2. Check trigger scores meet threshold (>= 0.80)",
      "3. Verify hook scripts are valid and executable",
      "4. Check agent markdown files have proper frontmatter",
      "5. Report overall compliance score",
      "",
      "Output a structured report with pass/fail for each check.",
      "",
    ].join("\n"),
  };
}

function generateRunCommand(domain: string, toolNames: string[]): GeneratedCommand {
  return {
    filename: "run.md",
    content: [
      "---",
      `description: Execute a ${domain} workflow. Use when running ${domain} tasks, pipelines, or operations.`,
      "context: fork",
      `allowed-tools: "Read,Grep,Glob,Bash"`,
      "---",
      "",
      `Execute a ${domain} domain workflow based on "$ARGUMENTS".`,
      "",
      "Steps:",
      `1. Parse the task from $ARGUMENTS`,
      `2. Identify which ${domain} tools are needed`,
      "3. Read relevant skill documentation for command syntax",
      "4. Execute the workflow step by step",
      "5. Report results",
      "",
      `Available tools: ${toolNames.join(", ")}`,
      "",
    ].join("\n"),
  };
}

function generateTeamCommand(domain: string, toolNames: string[]): GeneratedCommand {
  return {
    filename: "team.md",
    content: [
      "---",
      `description: Spawn a ${domain} agent team for complex tasks. Use when a task requires multiple specialized agents working together.`,
      "context: fork",
      "---",
      "",
      `Spawn a team of ${domain} domain agents to handle "$ARGUMENTS".`,
      "",
      "The team consists of:",
      `- **${domain}-expert**: Orchestrates the overall task, delegates subtasks`,
      `- **Specialized workers**: Each handles a specific aspect of the ${domain} domain`,
      "",
      "Workflow:",
      "1. The expert agent analyzes the task and creates a plan",
      "2. Worker agents are spawned for specific subtasks",
      "3. Results are collected and synthesized",
      "4. A final report is produced",
      "",
      `Available tools: ${toolNames.join(", ")}`,
      "",
    ].join("\n"),
  };
}

function generateUpdateCommand(domain: string, toolNames: string[]): GeneratedCommand {
  return {
    filename: "update.md",
    content: [
      "---",
      `description: Check for updates to ${domain} tools. Use when wanting to update tools to latest versions.`,
      "---",
      "",
      `Check for updates across ${domain} domain tools:`,
      "",
      "1. For each tool, check the current installed version",
      "2. Query the package registry for the latest available version",
      "3. Report which tools have updates available",
      "4. If $ARGUMENTS contains 'apply', install the updates",
      "",
      `Tools: ${toolNames.join(", ")}`,
      "",
    ].join("\n"),
  };
}
