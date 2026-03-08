---
name: outlines
version: 0.0.0
description: "CLI tool: outlines. Use this skill when working with outlines-related tasks."
ingredients:
  - dottxt-ai/outlines
tags:
  - cli
---

# outlines

CLI tool: outlines

## Usage

```bash
# Show help
outlines --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run outlines -- --help --json

# Introspect command schema
agents-cli schema outlines --json

# Dry-run before executing
agents-cli run outlines -- <args> --dry-run
```
