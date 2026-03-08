---
name: vigil-llm
version: 0.0.0
description: "CLI tool: vigil-llm. Use this skill when working with vigil-llm-related tasks."
ingredients:
  - deadbits/vigil-llm
tags:
  - cli
---

# vigil-llm

CLI tool: vigil-llm

## Usage

```bash
# Show help
vigil-llm --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run vigil-llm -- --help --json

# Introspect command schema
agents-cli schema vigil-llm --json

# Dry-run before executing
agents-cli run vigil-llm -- <args> --dry-run
```
