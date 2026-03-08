---
name: helicone
version: 0.1.0
description: "CLI tool: helicone. Use this skill when working with helicone-related tasks."
ingredients:
  - Helicone/helicone
tags:
  - cli
---

# helicone

CLI tool: helicone

## Usage

```bash
# Show help
helicone --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run helicone -- --help --json

# Introspect command schema
agents-cli schema helicone --json

# Dry-run before executing
agents-cli run helicone -- <args> --dry-run
```
