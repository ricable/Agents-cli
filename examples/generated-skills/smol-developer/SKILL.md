---
name: developer
version: 0.0.0
description: "CLI tool: developer. Use this skill when working with developer-related tasks."
ingredients:
  - smol-ai/developer
tags:
  - cli
---

# developer

CLI tool: developer

## Usage

```bash
# Show help
developer --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run developer -- --help --json

# Introspect command schema
agents-cli schema developer --json

# Dry-run before executing
agents-cli run developer -- <args> --dry-run
```
