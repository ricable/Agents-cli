---
name: sweep
version: 0.0.0
description: "Sweep: AI coding assistant for JetBrains. Use this skill when working with sweep-related tasks."
ingredients:
  - sweepai/sweep
tags:
  - ai
  - ai-developer
  - ai-softwar
  - ai-software
  - code-assistant
  - code-search
  - developer-tools
  - github-app
  - gpt-4
  - cli
# homepage: https://sweep.dev
# license: NOASSERTION
---

# sweep

Sweep: AI coding assistant for JetBrains

**Source**: https://sweep.dev

## Usage

```bash
# Show help
sweep --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run sweep -- --help --json

# Introspect command schema
agents-cli schema sweep --json

# Dry-run before executing
agents-cli run sweep -- <args> --dry-run
```
