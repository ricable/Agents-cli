---
name: deepeval
version: 0.0.0
description: "CLI tool: deepeval. Use this skill when working with deepeval-related tasks."
ingredients:
  - confident-ai/deepeval
tags:
  - cli
---

# deepeval

CLI tool: deepeval

## Usage

```bash
# Show help
deepeval --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run deepeval -- --help --json

# Introspect command schema
agents-cli schema deepeval --json

# Dry-run before executing
agents-cli run deepeval -- <args> --dry-run
```
