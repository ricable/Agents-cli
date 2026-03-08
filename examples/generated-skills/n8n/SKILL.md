---
name: n8n
version: 2.11.0
description: "Fair-code workflow automation platform with native AI capabilities. Combine visual building with custom code, self-host or cloud, 400+ integrations.. Use this skill when working with n8n-related tasks."
ingredients:
  - n8n-io/n8n
tags:
  - ai
  - apis
  - automation
  - cli
  - data-flow
  - development
  - integration-framework
  - integrations
  - ipaas
  - low-code
  - low-code-platform
  - mcp
  - mcp-client
  - mcp-server
  - n8n
  - no-code
  - self-hosted
  - typescript
  - workflow
  - workflow-automation
# homepage: https://n8n.io
# license: NOASSERTION
---

# n8n

Fair-code workflow automation platform with native AI capabilities. Combine visual building with custom code, self-host or cloud, 400+ integrations.

**Source**: https://n8n.io

## Usage

```bash
# Show help
n8n --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run n8n -- --help --json

# Introspect command schema
agents-cli schema n8n --json

# Dry-run before executing
agents-cli run n8n -- <args> --dry-run
```
