---
name: WhisperSpeech
version: 0.0.0
description: "CLI tool: WhisperSpeech. Use this skill when working with WhisperSpeech-related tasks."
ingredients:
  - WhisperSpeech/WhisperSpeech
tags:
  - cli
---

# WhisperSpeech

CLI tool: WhisperSpeech

## Usage

```bash
# Show help
WhisperSpeech --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run WhisperSpeech -- --help --json

# Introspect command schema
agents-cli schema WhisperSpeech --json

# Dry-run before executing
agents-cli run WhisperSpeech -- <args> --dry-run
```
