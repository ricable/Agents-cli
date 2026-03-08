---
name: optimum-quanto
version: 0.0.0
description: "CLI tool: optimum-quanto. Use this skill when working with optimum-quanto-related tasks."
ingredients:
  - huggingface/optimum-quanto
tags:
  - cli
---

# optimum-quanto

CLI tool: optimum-quanto

## Usage

```bash
# Show help
optimum-quanto --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run optimum-quanto -- --help --json

# Introspect command schema
agents-cli schema optimum-quanto --json

# Dry-run before executing
agents-cli run optimum-quanto -- <args> --dry-run
```
