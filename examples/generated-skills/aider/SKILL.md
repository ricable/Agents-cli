---
name: aider
version: 0.0.0
description: "CLI tool: aider. Use this skill when working with aider-related tasks."
ingredients:
  - paul-gauthier/aider
tags:
  - cli
---

# aider

CLI tool: aider

## Usage

```bash
# Show help
aider --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run aider -- --help --json

# Introspect command schema
agents-cli schema aider --json

# Dry-run before executing
agents-cli run aider -- <args> --dry-run
```
