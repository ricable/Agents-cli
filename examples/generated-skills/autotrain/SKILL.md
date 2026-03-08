---
name: autotrain-advanced
version: 0.0.0
description: "CLI tool: autotrain-advanced. Use this skill when working with autotrain-advanced-related tasks."
ingredients:
  - huggingface/autotrain-advanced
tags:
  - cli
---

# autotrain-advanced

CLI tool: autotrain-advanced

## Usage

```bash
# Show help
autotrain-advanced --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run autotrain-advanced -- --help --json

# Introspect command schema
agents-cli schema autotrain-advanced --json

# Dry-run before executing
agents-cli run autotrain-advanced -- <args> --dry-run
```
