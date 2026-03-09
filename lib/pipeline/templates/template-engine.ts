// Template engine - interpolates templates with config

import type { WorkflowTemplate, TemplateConfig, CouncilConfig, PublishingConfig, EcommerceConfig, AssistantConfig } from "./types.js";
import type { DiscoveredPackage, ExtractedEntity, WorkflowIntent } from "../../types.js";
import { getTemplate } from "./index.js";

/**
 * Generate agent code from template and packages
 */
export function generateFromTemplate(
  intent: WorkflowIntent,
  packages: DiscoveredPackage[],
  entities: ExtractedEntity[],
  options: { name?: string } = {}
): { code: string; envVars: string[]; template: WorkflowTemplate } | null {
  const template = getTemplate(intent);

  if (!template) {
    return null;
  }

  const config = buildConfig(intent, packages, entities, options);
  const code = template.generateAgent(config as TemplateConfig);
  const envVars = template.generateEnv?.(config as TemplateConfig) ?? [];

  return { code, envVars, template };
}

/**
 * Build config for template based on intent
 */
function buildConfig(
  intent: WorkflowIntent,
  packages: DiscoveredPackage[],
  _entities: ExtractedEntity[],
  options: { name?: string }
): CouncilConfig | PublishingConfig | EcommerceConfig | AssistantConfig | TemplateConfig {
  const name = options.name || `${intent}-workflow`;

  switch (intent) {
    case "council":
      return {
        name,
        description: "Multi-provider consensus workflow",
        strategy: "parallel-with-consensus",
        providers: packages.map(p => ({
          name: p.name,
          clientClass: toClassName(p.name),
          envKey: toEnvKey(p.name),
          packageName: p.name,
        })),
        votingMethod: "quality-score",
        fallback: true,
      };

    case "publishing":
      return {
        name,
        description: "Multi-platform social publishing",
        strategy: "fan-out-with-confirmation",
        platforms: packages.map(p => ({
          name: p.name,
          clientClass: toClassName(p.name),
          envKey: toEnvKey(p.name),
          packageName: p.name,
        })),
        confirmSuccess: true,
        retryFailed: true,
        collectAnalytics: true,
      };

    case "ecommerce": {
      const npmPackages = packages.filter(p => p.source === "npm");
      return {
        name,
        description: "Full-stack e-commerce with payments",
        strategy: "layered-architecture",
        frontend: npmPackages.filter(p => ["ui", "web"].some(d => p.domain.includes(d))).map(p => p.name),
        backend: npmPackages.filter(p => ["web", "api"].some(d => p.domain.includes(d))).map(p => p.name),
        payments: npmPackages.filter(p => p.domain.includes("payment")).map(p => p.name),
        database: npmPackages.filter(p => p.domain.includes("database")).map(p => p.name),
      };
    }

    case "assistant":
      return {
        name,
        description: "Personal AI assistant for repo processing",
        strategy: "event-driven-pipeline",
        triggers: ["cli", "webhook"] as Array<"webhook" | "cli" | "schedule">,
        steps: [
          { name: "fetch", action: "npx opensrc {repo}" },
          { name: "index", action: "npx pop-skills index" },
          { name: "embed", action: "npx pop-skills embed" },
          { name: "skill", action: "npx pop-skills skill --ai" },
        ],
        notify: { email: undefined },
      };

    default:
      return {
        name,
        description: "Custom workflow",
        strategy: "custom",
      };
  }
}

/**
 * Convert package name to class name
 */
function toClassName(name: string): string {
  return name
    .split(/[-_]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join("") + "Client";
}

/**
 * Convert package name to env key
 */
function toEnvKey(name: string): string {
  return name.toUpperCase().replace(/[-]/g, "_") + "_API_KEY";
}
