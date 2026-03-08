---
name: uptrain
version: 0.0.0
description: "CLI tool: uptrain. Use this skill when working with uptrain-related tasks."
ingredients:
  - uptrain-ai/uptrain
tags:
  - cli
---

# uptrain

CLI tool: uptrain

## Usage

```bash
# Show help
uptrain --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run uptrain -- --help --json

# Introspect command schema
agents-cli schema uptrain --json

# Dry-run before executing
agents-cli run uptrain -- <args> --dry-run
```
