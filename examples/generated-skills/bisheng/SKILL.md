---
name: bisheng
version: 0.0.0
description: "CLI tool: bisheng. Use this skill when working with bisheng-related tasks."
ingredients:
  - dataelement/bisheng
tags:
  - cli
---

# bisheng

CLI tool: bisheng

## Usage

```bash
# Show help
bisheng --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run bisheng -- --help --json

# Introspect command schema
agents-cli schema bisheng --json

# Dry-run before executing
agents-cli run bisheng -- <args> --dry-run
```
