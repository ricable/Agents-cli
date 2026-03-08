---
name: trufflehog
version: 0.0.0
description: "CLI tool: trufflehog. Use this skill when working with trufflehog-related tasks."
ingredients:
  - trufflesecurity/trufflehog
tags:
  - cli
---

# trufflehog

CLI tool: trufflehog

## Usage

```bash
# Show help
trufflehog --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run trufflehog -- --help --json

# Introspect command schema
agents-cli schema trufflehog --json

# Dry-run before executing
agents-cli run trufflehog -- <args> --dry-run
```
