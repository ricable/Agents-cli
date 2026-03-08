---
name: opik
version: 0.0.0
description: "CLI tool: opik. Use this skill when working with opik-related tasks."
ingredients:
  - comet-ml/opik
tags:
  - cli
---

# opik

CLI tool: opik

## Usage

```bash
# Show help
opik --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run opik -- --help --json

# Introspect command schema
agents-cli schema opik --json

# Dry-run before executing
agents-cli run opik -- <args> --dry-run
```
