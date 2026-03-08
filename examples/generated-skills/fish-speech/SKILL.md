---
name: fish-speech
version: 0.0.0
description: "CLI tool: fish-speech. Use this skill when working with fish-speech-related tasks."
ingredients:
  - fishaudio/fish-speech
tags:
  - cli
---

# fish-speech

CLI tool: fish-speech

## Usage

```bash
# Show help
fish-speech --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run fish-speech -- --help --json

# Introspect command schema
agents-cli schema fish-speech --json

# Dry-run before executing
agents-cli run fish-speech -- <args> --dry-run
```
