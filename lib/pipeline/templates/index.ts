// Template index - exports all templates

export { COUNCIL_TEMPLATE } from "./council.template.js";
export { PUBLISHING_TEMPLATE } from "./publishing.template.js";
export { ECOMMERCE_TEMPLATE } from "./ecommerce.template.js";
export { ASSISTANT_TEMPLATE } from "./assistant.template.js";
export type { WorkflowTemplate, CouncilConfig, PublishingConfig, EcommerceConfig, AssistantConfig, TemplateConfig, AnyTemplateConfig } from "./types.js";

import { COUNCIL_TEMPLATE } from "./council.template.js";
import { PUBLISHING_TEMPLATE } from "./publishing.template.js";
import { ECOMMERCE_TEMPLATE } from "./ecommerce.template.js";
import { ASSISTANT_TEMPLATE } from "./assistant.template.js";
import type { WorkflowTemplate } from "./types.js";
import type { WorkflowIntent } from "../../types.js";

// Use a more permissive type for the templates record
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTemplate = WorkflowTemplate<any>;

export const TEMPLATES: Record<WorkflowIntent, AnyTemplate | undefined> = {
  council: COUNCIL_TEMPLATE,
  publishing: PUBLISHING_TEMPLATE,
  ecommerce: ECOMMERCE_TEMPLATE,
  assistant: ASSISTANT_TEMPLATE,
  "api-service": undefined, // Uses custom template
  custom: undefined,
};

/**
 * Get template by intent
 */
export function getTemplate(intent: WorkflowIntent): AnyTemplate | undefined {
  return TEMPLATES[intent];
}

/**
 * Get all available templates
 */
export function getAllTemplates(): AnyTemplate[] {
  return Object.values(TEMPLATES).filter((t): t is AnyTemplate => t !== undefined);
}
