---
name: TTS
version: 0.0.0
description: "CLI tool: TTS. Use this skill when working with TTS-related tasks."
ingredients:
  - coqui-ai/TTS
tags:
  - cli
---

# TTS

CLI tool: TTS

## Usage

```bash
# Show help
TTS --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run TTS -- --help --json

# Introspect command schema
agents-cli schema TTS --json

# Dry-run before executing
agents-cli run TTS -- <args> --dry-run
```
