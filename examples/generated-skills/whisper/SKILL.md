---
name: whisper
version: 0.0.0
description: "CLI tool: whisper. Use this skill when working with whisper-related tasks."
ingredients:
  - openai/whisper
tags:
  - cli
---

# whisper

CLI tool: whisper

## Usage

```bash
# Show help
whisper --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run whisper -- --help --json

# Introspect command schema
agents-cli schema whisper --json

# Dry-run before executing
agents-cli run whisper -- <args> --dry-run
```
