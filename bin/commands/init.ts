import { Command } from "commander";
import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { success, failure, emit } from "../../lib/output.js";
import { generateSkillMd } from "../../lib/skills.js";
import { isJsonMode } from "./shared.js";

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Initialize a new agents-cli project with SKILL.md")
    .option("-n, --name <name>", "Project name", "my-agent")
    .option("-d, --description <desc>", "Project description", "A new agent skill")
    .option("--json", "Output as structured JSON")
    .action((opts: { name: string; description: string; json?: boolean }) => {
      const start = Date.now();
      const json = isJsonMode(opts);
      const skillPath = resolve("SKILL.md");

      if (existsSync(skillPath)) {
        emit(failure("init", "ALREADY_EXISTS", "SKILL.md already exists in this directory.", start), json);
        if (!json) console.error("SKILL.md already exists in this directory.");
        return;
      }

      const content = generateSkillMd(opts.name, opts.description);
      writeFileSync(skillPath, content, "utf-8");

      if (json) {
        emit(success("init", { path: skillPath, name: opts.name }, start), true);
      } else {
        console.log(`Initialized ${skillPath}`);
        console.log(`\nNext steps:`);
        console.log(`  1. Edit SKILL.md to add your tool ingredients`);
        console.log(`  2. Run: agents-cli skills install SKILL.md`);
        console.log(`  3. Run: agents-cli freeze`);
      }
    });
}
