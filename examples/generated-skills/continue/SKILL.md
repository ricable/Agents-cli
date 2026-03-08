---
name: continue
version: 0.0.0
description: "⏩ Source-controlled AI checks, enforceable in CI. Powered by the open-source Continue CLI. Use this skill when working with continue-related tasks."
ingredients:
  - continuedev/continue
tags:
  - agent
  - ai
  - claude
  - cli
  - cloud-agents
  - continuous-ai
  - developer-tools
  - gemini
  - gpt
  - llm
  - open-source
  - workflows
# homepage: https://docs.continue.dev
# license: Apache-2.0
---

# continue

⏩ Source-controlled AI checks, enforceable in CI. Powered by the open-source Continue CLI

**Source**: https://docs.continue.dev

## Usage

```bash
# Show help
continue --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run continue -- --help --json

# Introspect command schema
agents-cli schema continue --json

# Dry-run before executing
agents-cli run continue -- <args> --dry-run
```
