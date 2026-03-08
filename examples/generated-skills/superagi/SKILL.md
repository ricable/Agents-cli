---
name: SuperAGI
version: 0.0.0
description: "CLI tool: SuperAGI. Use this skill when working with SuperAGI-related tasks."
ingredients:
  - TransformerOptimus/SuperAGI
tags:
  - cli
---

# SuperAGI

CLI tool: SuperAGI

## Usage

```bash
# Show help
SuperAGI --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run SuperAGI -- --help --json

# Introspect command schema
agents-cli schema SuperAGI --json

# Dry-run before executing
agents-cli run SuperAGI -- <args> --dry-run
```
