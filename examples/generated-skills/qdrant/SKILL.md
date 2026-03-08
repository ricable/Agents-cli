---
name: qdrant
version: 0.0.0
description: "CLI tool: qdrant. Use this skill when working with qdrant-related tasks."
ingredients:
  - qdrant/qdrant
tags:
  - cli
---

# qdrant

CLI tool: qdrant

## Usage

```bash
# Show help
qdrant --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run qdrant -- --help --json

# Introspect command schema
agents-cli schema qdrant --json

# Dry-run before executing
agents-cli run qdrant -- <args> --dry-run
```
