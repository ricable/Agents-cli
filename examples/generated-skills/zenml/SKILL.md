---
name: zenml
version: 0.0.0
description: "CLI tool: zenml. Use this skill when working with zenml-related tasks."
ingredients:
  - zenml-io/zenml
tags:
  - cli
---

# zenml

CLI tool: zenml

## Usage

```bash
# Show help
zenml --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run zenml -- --help --json

# Introspect command schema
agents-cli schema zenml --json

# Dry-run before executing
agents-cli run zenml -- <args> --dry-run
```
