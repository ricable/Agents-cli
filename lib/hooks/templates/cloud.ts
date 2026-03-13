/**
 * hooks/templates/cloud.ts — Cloud infrastructure domain hook configuration.
 *
 * PreToolUse: Validate region, block dangerous operations
 * Stop: Verify deployment health
 */

import type { DomainHookConfig } from "../types.js";

export const CLOUD_HOOKS: DomainHookConfig = {
  domain: "cloud",

  blockPatterns: [
    {
      pattern: "aws\\s+s3\\s+rb\\s+.*--force",
      reason: "Force-removing S3 bucket blocked — verify contents first",
      tools: ["Bash"],
    },
    {
      pattern: "aws\\s+ec2\\s+terminate-instances\\s+.*--instance-ids\\s+\\S+\\s+\\S+",
      reason: "Bulk EC2 termination blocked — terminate instances individually",
      tools: ["Bash"],
    },
    {
      pattern: "gcloud\\s+projects\\s+delete\\b",
      reason: "GCP project deletion blocked — requires manual confirmation",
      tools: ["Bash"],
    },
    {
      pattern: "az\\s+group\\s+delete\\s+(?!.*--no-wait)",
      reason: "Azure resource group deletion blocked — use portal for safety",
      tools: ["Bash"],
    },
  ],

  postValidations: [
    {
      command: 'echo "Cloud operation at $(date -u +%Y-%m-%dT%H:%M:%SZ): $TOOL_NAME" >> "${CLAUDE_PLUGIN_ROOT}/hooks/.cloud-audit.log"',
      description: "Log cloud operations to audit trail",
      tools: ["Bash"],
    },
  ],

  qualityGates: [
    {
      command: 'test ! -f *.tf || terraform validate 2>/dev/null',
      description: "Validate Terraform configuration",
    },
    {
      command: 'test ! -f serverless.yml || npx serverless print 2>/dev/null || true',
      description: "Validate serverless configuration",
    },
  ],

  contextInjections: [
    {
      command: 'aws sts get-caller-identity 2>/dev/null | jq -r ".Account // empty" || echo "AWS not configured"',
      label: "aws-account",
    },
    {
      command: 'echo "Region: ${AWS_REGION:-${AWS_DEFAULT_REGION:-not set}}"',
      label: "aws-region",
    },
  ],

  alertTriggers: [
    {
      condition: "cloud resource created or deleted",
      message: "Cloud resource change detected — verify in console",
    },
  ],
};
