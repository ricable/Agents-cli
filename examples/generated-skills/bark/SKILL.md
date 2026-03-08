---
name: bark
version: 0.0.0
description: "CLI tool: bark. Use this skill when working with bark-related tasks."
ingredients:
  - suno-ai/bark
tags:
  - cli
---

# bark

CLI tool: bark

## Usage

```bash
# Show help
bark --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run bark -- --help --json

# Introspect command schema
agents-cli schema bark --json

# Dry-run before executing
agents-cli run bark -- <args> --dry-run
```
