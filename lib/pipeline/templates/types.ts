// Template types


export interface TemplateConfig {
  name: string;
  description: string;
  strategy: string;
}

export interface CouncilConfig extends TemplateConfig {
  providers: Array<{
    name: string;
    clientClass: string;
    envKey: string;
    packageName?: string;
  }>;
  strategy: "parallel-with-consensus" | "sequential-with-fallback" | "race";
  votingMethod: "quality-score" | "majority-vote" | "weighted-average";
  fallback: boolean;
}

export interface PublishingConfig extends TemplateConfig {
  platforms: Array<{
    name: string;
    clientClass: string;
    envKey: string;
    packageName?: string;
  }>;
  confirmSuccess: boolean;
  retryFailed: boolean;
  collectAnalytics: boolean;
}

export interface EcommerceConfig extends TemplateConfig {
  frontend: string[];
  backend: string[];
  payments: string[];
  database: string[];
}

export interface AssistantConfig extends TemplateConfig {
  triggers: Array<"webhook" | "cli" | "schedule">;
  steps: Array<{ name: string; action: string }>;
  notify: { email?: string };
}

// Generic workflow template interface
export interface WorkflowTemplate<T extends TemplateConfig = TemplateConfig> {
  name: string;
  description: string;
  strategy: string;
  generateAgent: (config: T) => string;
  generateEnv?: (config: T) => string[];
  generateStructure?: (config: T) => {
    directories: string[];
    files: string[];
  };
}

// Union type for all template configs
export type AnyTemplateConfig = TemplateConfig | CouncilConfig | PublishingConfig | EcommerceConfig | AssistantConfig;
