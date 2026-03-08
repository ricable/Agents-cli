---
name: mastra
version: 0.1.11
description: "CLI tool: mastra. Use this skill when working with mastra-related tasks."
ingredients:
  - mastra-ai/mastra
tags:
  - cli
---

# mastra

CLI tool: mastra

## Usage

```bash
# Show help
mastra --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run mastra -- --help --json

# Introspect command schema
agents-cli schema mastra --json

# Dry-run before executing
agents-cli run mastra -- <args> --dry-run
```
