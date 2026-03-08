---
name: openllmetry
version: 0.0.0
description: "CLI tool: openllmetry. Use this skill when working with openllmetry-related tasks."
ingredients:
  - traceloop/openllmetry
tags:
  - cli
---

# openllmetry

CLI tool: openllmetry

## Usage

```bash
# Show help
openllmetry --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run openllmetry -- --help --json

# Introspect command schema
agents-cli schema openllmetry --json

# Dry-run before executing
agents-cli run openllmetry -- <args> --dry-run
```
