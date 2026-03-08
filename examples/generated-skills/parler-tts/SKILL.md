---
name: parler-tts
version: 0.0.0
description: "CLI tool: parler-tts. Use this skill when working with parler-tts-related tasks."
ingredients:
  - huggingface/parler-tts
tags:
  - cli
---

# parler-tts

CLI tool: parler-tts

## Usage

```bash
# Show help
parler-tts --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run parler-tts -- --help --json

# Introspect command schema
agents-cli schema parler-tts --json

# Dry-run before executing
agents-cli run parler-tts -- <args> --dry-run
```
