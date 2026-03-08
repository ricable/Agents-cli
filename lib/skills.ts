import type { Skill, SkillFrontmatter, Lockfile } from "./types.js";

/** Parse SKILL.md frontmatter from raw markdown content */
export function parseFrontmatter(_content: string): SkillFrontmatter | null {
  // Phase 4: YAML frontmatter parsing
  return null;
}

/** Build context by assembling SKILL.md + tool CONTEXT.mds */
export function buildContext(_skill: Skill): string {
  // Phase 4: context assembly
  return "";
}

/** Generate a new SKILL.md scaffold */
export function generateSkillMd(name: string, description: string): string {
  return [
    "---",
    `name: ${name}`,
    "version: 0.1.0",
    `description: ${description}`,
    "ingredients: []",
    "tags: []",
    "---",
    "",
    `# ${name}`,
    "",
    description,
    "",
  ].join("\n");
}

/** Read and parse an agentcli.lock file */
export function parseLockfile(_content: string): Lockfile | null {
  // Phase 4: lockfile parsing
  return null;
}
