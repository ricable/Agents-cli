/**
 * agents-cli — package manager for AI agent tools.
 *
 * Design principles (from "Rewrite Your CLI for AI Agents"):
 *   1. Structured JSON output on every command (--json or OUTPUT_FORMAT=json)
 *   2. Schema introspection via `schema` command
 *   3. Context window discipline (--fields, NDJSON pagination)
 *   4. Input hardening against agent hallucinations
 *   5. Agent skills auto-generated on install
 *   6. Multi-surface: CLI + MCP from same source of truth
 *   7. --dry-run on all mutating operations
 */

import { Command } from "commander";
import { readPkgVersion } from "../lib/pkg-utils.js";
import { registerAddCommand } from "./commands/add.js";
import { registerListCommand } from "./commands/list.js";
import { registerDescribeCommand } from "./commands/describe.js";
import { registerSchemaCommand } from "./commands/schema.js";
import { registerRunCommand } from "./commands/run.js";
import { registerRemoveCommand } from "./commands/remove.js";
import { registerUpdateCommand } from "./commands/update.js";
import { registerSearchCommand } from "./commands/search.js";
import { registerScanCommand } from "./commands/scan.js";
import { registerInfoCommand } from "./commands/info.js";
import { registerFreezeCommand } from "./commands/freeze.js";
import { registerInstallCommand } from "./commands/install.js";
import { registerVerifyCommand } from "./commands/verify.js";
import { registerSkillsCommand } from "./commands/skills.js";
import { registerMcpCommand } from "./commands/mcp.js";
import { registerPluginCommand } from "./commands/plugin.js";
import { registerInitCommand } from "./commands/init.js";
import { registerPublishCommand } from "./commands/publish.js";
import { registerPipelineCommand } from "./commands/pipeline.js";
import { registerIndexCommand } from "./commands/index-cmd.js";
import { registerGenerateCommand } from "./commands/generate.js";
import { registerCrawlCommand } from "./commands/crawl.js";
import { registerComposeCommand } from "./commands/compose.js";
import { registerStatsCommand } from "./commands/stats.js";

const VERSION = readPkgVersion(new URL("../", import.meta.url).pathname) ?? "0.1.0";

const program = new Command()
  .name("agents-cli")
  .description("Package manager for AI agent tools — discover, install, analyze, and expose CLI tools")
  .version(VERSION);

registerAddCommand(program);
registerListCommand(program);
registerDescribeCommand(program);
registerSchemaCommand(program);
registerRunCommand(program);
registerRemoveCommand(program);
registerUpdateCommand(program);
registerSearchCommand(program);
registerScanCommand(program);
registerInfoCommand(program);
registerFreezeCommand(program);
registerInstallCommand(program);
registerVerifyCommand(program);
registerSkillsCommand(program);
registerMcpCommand(program);
registerPluginCommand(program);
registerInitCommand(program);
registerPublishCommand(program);
registerPipelineCommand(program);
registerIndexCommand(program);
registerGenerateCommand(program);
registerCrawlCommand(program);
registerComposeCommand(program);
registerStatsCommand(program);

program.parse();
