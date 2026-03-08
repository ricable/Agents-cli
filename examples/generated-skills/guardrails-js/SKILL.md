---
name: guardrails-js
version: 0.1.1
description: "CLI tool: guardrails-js. Use this skill when working with guardrails-js-related tasks."
ingredients:
  - guardrails-ai/guardrails-js
tags:
  - cli
---

# guardrails-js

CLI tool: guardrails-js

## Usage

```bash
# Show help
guardrails-js --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run guardrails-js -- --help --json

# Introspect command schema
agents-cli schema guardrails-js --json

# Dry-run before executing
agents-cli run guardrails-js -- <args> --dry-run
```
