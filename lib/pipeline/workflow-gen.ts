// Skill workflow generator - generates composite skill from workflow

import type { GeneratedWorkflow, WorkflowIntent } from "../types.js";

export interface SkillConfig {
  name: string;
  description: string;
  workflow: GeneratedWorkflow;
}

/**
 * Generate a Claude Code skill from a workflow
 */
export function generateSkillFromWorkflow(workflow: GeneratedWorkflow): string {
  const { workflowName, intent, packages, envVars } = workflow;

  const skillContent = `---
name: ${workflowName}
description: ${getSkillDescription(intent)}
version: 1.0.0
author: agents-cli
---

# ${workflowName}

${getSkillDescription(intent)}

## Usage

\`\`\`bash
# Run the workflow
npx agents-cli run-${workflowName} "<prompt>"

# Or import as module
import { execute } from './workflow/${workflowName}-agent';
const result = await execute('your prompt');
\`\`\`

## Environment Setup

This workflow requires the following environment variables:

${envVars.map(v => `- \`${v.split("=")[0]}\``).join("\n")}

Copy \`.env.template\` to \`.env\` and fill in your values.

## Packages

This workflow uses the following packages:

${packages.map(p => `### ${p.name}

${p.description || "No description available."}

- **Source:** ${p.source}
- **Repo:** ${p.repo}
`).join("\n")}

## API Reference

### execute(prompt: string)

Execute the workflow with the given prompt.

\`\`\`typescript
const result = await execute('Generate an image of a sunset');
console.log(result);
\`\`\`

### Returns

\`\`\`typescript
interface WorkflowResult {
  success: boolean;
  data?: unknown;
  error?: string;
  duration: number;
}
\`\`\`

## Examples

${getExamples(intent)}
`;

  return skillContent;
}

/**
 * Get skill description based on intent
 */
function getSkillDescription(intent: WorkflowIntent): string {
  const descriptions: Record<WorkflowIntent, string> = {
    council: "Multi-provider consensus workflow for API orchestration with fallback and voting.",
    publishing: "Multi-platform social publishing with fan-out pattern and analytics.",
    ecommerce: "Full-stack e-commerce with payments, cart, and checkout workflow.",
    assistant: "Personal AI assistant for repository processing and indexing.",
    "api-service": "REST/GraphQL API service with standard CRUD operations.",
    custom: "Custom workflow generated from natural language prompt.",
  };
  return descriptions[intent];
}

/**
 * Get examples based on intent
 */
function getExamples(intent: WorkflowIntent): string {
  const examples: Record<WorkflowIntent, string> = {
    council: `\`\`\`typescript
// Image generation with multiple providers
const result = await execute('Generate a futuristic cityscape');

// The council will:
// 1. Send prompt to all providers in parallel
// 2. Collect responses and scores
// 3. Return consensus or best result
\`\`\``,
    publishing: `\`\`\`typescript
// Publish to multiple platforms
const result = await publish({
  text: 'Hello, world!',
  images: ['./image.jpg'],
});

// Result includes success/failure for each platform
console.log(\`Published to \${result.successful} platforms\`);
\`\`\``,
    ecommerce: `\`\`\`typescript
// Add item to cart
await cartService.addItem(userId, productId, 1);

// Create checkout session
const session = await checkoutService.createSession(cart);
// Redirect user to session.url
\`\`\``,
    assistant: `\`\`\`typescript
// Process a repository
const result = await processRepo('https://github.com/user/repo');

// Result includes:
// - Fetch status
// - Index status
// - Skill generation status
console.log(\`Skill generated at: \${result.skillPath}\`);
\`\`\``,
    "api-service": `\`\`\`typescript
// API endpoints are auto-generated
// GET /api/products
// POST /api/products
// GET /api/products/:id
// PUT /api/products/:id
// DELETE /api/products/:id
\`\`\``,
    custom: `\`\`\`typescript
// Custom workflow execution
const result = await execute('your input');
\`\`\``,
  };
  return examples[intent];
}

/**
 * Write skill to .claude/skills directory
 */
export async function writeSkill(workflow: GeneratedWorkflow): Promise<string> {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");

  const skillContent = generateSkillFromWorkflow(workflow);
  const skillDir = path.join(".claude", "skills", `src-${workflow.workflowName}`);
  const skillPath = path.join(skillDir, "SKILL.md");

  await fs.mkdir(skillDir, { recursive: true });
  await fs.writeFile(skillPath, skillContent, "utf-8");

  return skillPath;
}
