---
name: jsonformer
version: 0.0.0
description: "CLI tool: jsonformer. Use this skill when working with jsonformer-related tasks."
ingredients:
  - 1rgs/jsonformer
tags:
  - cli
---

# jsonformer

CLI tool: jsonformer

## Usage

```bash
# Show help
jsonformer --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run jsonformer -- --help --json

# Introspect command schema
agents-cli schema jsonformer --json

# Dry-run before executing
agents-cli run jsonformer -- <args> --dry-run
```
