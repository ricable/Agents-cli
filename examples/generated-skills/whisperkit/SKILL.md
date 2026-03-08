---
name: WhisperKit
version: 0.0.0
description: "CLI tool: WhisperKit. Use this skill when working with WhisperKit-related tasks."
ingredients:
  - argmaxinc/WhisperKit
tags:
  - cli
---

# WhisperKit

CLI tool: WhisperKit

## Usage

```bash
# Show help
WhisperKit --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run WhisperKit -- --help --json

# Introspect command schema
agents-cli schema WhisperKit --json

# Dry-run before executing
agents-cli run WhisperKit -- <args> --dry-run
```
