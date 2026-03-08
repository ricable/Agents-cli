---
name: tortoise-tts
version: 0.0.0
description: "CLI tool: tortoise-tts. Use this skill when working with tortoise-tts-related tasks."
ingredients:
  - neonbjb/tortoise-tts
tags:
  - cli
---

# tortoise-tts

CLI tool: tortoise-tts

## Usage

```bash
# Show help
tortoise-tts --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run tortoise-tts -- --help --json

# Introspect command schema
agents-cli schema tortoise-tts --json

# Dry-run before executing
agents-cli run tortoise-tts -- <args> --dry-run
```
