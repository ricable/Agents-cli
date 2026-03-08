---
name: audiocraft
version: 0.0.0
description: "CLI tool: audiocraft. Use this skill when working with audiocraft-related tasks."
ingredients:
  - facebookresearch/audiocraft
tags:
  - cli
---

# audiocraft

CLI tool: audiocraft

## Usage

```bash
# Show help
audiocraft --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run audiocraft -- --help --json

# Introspect command schema
agents-cli schema audiocraft --json

# Dry-run before executing
agents-cli run audiocraft -- <args> --dry-run
```
