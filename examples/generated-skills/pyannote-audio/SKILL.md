---
name: pyannote-audio
version: 0.0.0
description: "CLI tool: pyannote-audio. Use this skill when working with pyannote-audio-related tasks."
ingredients:
  - pyannote/pyannote-audio
tags:
  - cli
---

# pyannote-audio

CLI tool: pyannote-audio

## Usage

```bash
# Show help
pyannote-audio --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run pyannote-audio -- --help --json

# Introspect command schema
agents-cli schema pyannote-audio --json

# Dry-run before executing
agents-cli run pyannote-audio -- <args> --dry-run
```
