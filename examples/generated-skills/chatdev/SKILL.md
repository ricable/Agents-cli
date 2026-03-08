---
name: ChatDev
version: 0.0.0
description: "CLI tool: ChatDev. Use this skill when working with ChatDev-related tasks."
ingredients:
  - OpenBMB/ChatDev
tags:
  - cli
---

# ChatDev

CLI tool: ChatDev

## Usage

```bash
# Show help
ChatDev --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run ChatDev -- --help --json

# Introspect command schema
agents-cli schema ChatDev --json

# Dry-run before executing
agents-cli run ChatDev -- <args> --dry-run
```
