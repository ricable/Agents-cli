---
name: optimum
version: 0.0.0
description: "CLI tool: optimum. Use this skill when working with optimum-related tasks."
ingredients:
  - huggingface/optimum
tags:
  - cli
---

# optimum

CLI tool: optimum

## Usage

```bash
# Show help
optimum --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run optimum -- --help --json

# Introspect command schema
agents-cli schema optimum --json

# Dry-run before executing
agents-cli run optimum -- <args> --dry-run
```
