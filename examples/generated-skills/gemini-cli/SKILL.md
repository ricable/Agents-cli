---
name: gemini-cli
version: 0.34.0-nightly.20260304.28af4e127
description: "CLI tool: gemini-cli. Use this skill when working with gemini-cli-related tasks."
ingredients:
  - google-gemini/gemini-cli
tags:
  - cli
---

# gemini-cli

CLI tool: gemini-cli

## Usage

```bash
# Show help
gemini-cli --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run gemini-cli -- --help --json

# Introspect command schema
agents-cli schema gemini-cli --json

# Dry-run before executing
agents-cli run gemini-cli -- <args> --dry-run
```
