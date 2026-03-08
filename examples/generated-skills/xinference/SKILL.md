---
name: inference
version: 0.0.0
description: "CLI tool: inference. Use this skill when working with inference-related tasks."
ingredients:
  - xorbitsai/inference
tags:
  - cli
---

# inference

CLI tool: inference

## Usage

```bash
# Show help
inference --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run inference -- --help --json

# Introspect command schema
agents-cli schema inference --json

# Dry-run before executing
agents-cli run inference -- <args> --dry-run
```
