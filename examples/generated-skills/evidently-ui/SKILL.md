---
name: evidently
version: 0.0.0
description: "CLI tool: evidently. Use this skill when working with evidently-related tasks."
ingredients:
  - evidentlyai/evidently
tags:
  - cli
---

# evidently

CLI tool: evidently

## Usage

```bash
# Show help
evidently --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run evidently -- --help --json

# Introspect command schema
agents-cli schema evidently --json

# Dry-run before executing
agents-cli run evidently -- <args> --dry-run
```
