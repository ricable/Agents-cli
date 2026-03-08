---
name: aphrodite-engine
version: 0.0.0
description: "CLI tool: aphrodite-engine. Use this skill when working with aphrodite-engine-related tasks."
ingredients:
  - PygmalionAI/aphrodite-engine
tags:
  - cli
---

# aphrodite-engine

CLI tool: aphrodite-engine

## Usage

```bash
# Show help
aphrodite-engine --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run aphrodite-engine -- --help --json

# Introspect command schema
agents-cli schema aphrodite-engine --json

# Dry-run before executing
agents-cli run aphrodite-engine -- <args> --dry-run
```
