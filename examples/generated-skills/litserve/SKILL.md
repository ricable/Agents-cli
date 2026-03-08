---
name: LitServe
version: 0.0.0
description: "CLI tool: LitServe. Use this skill when working with LitServe-related tasks."
ingredients:
  - Lightning-AI/LitServe
tags:
  - cli
---

# LitServe

CLI tool: LitServe

## Usage

```bash
# Show help
LitServe --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run LitServe -- --help --json

# Introspect command schema
agents-cli schema LitServe --json

# Dry-run before executing
agents-cli run LitServe -- <args> --dry-run
```
