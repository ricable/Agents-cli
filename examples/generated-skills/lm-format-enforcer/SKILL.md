---
name: lm-format-enforcer
version: 0.0.0
description: "CLI tool: lm-format-enforcer. Use this skill when working with lm-format-enforcer-related tasks."
ingredients:
  - noamgat/lm-format-enforcer
tags:
  - cli
---

# lm-format-enforcer

CLI tool: lm-format-enforcer

## Usage

```bash
# Show help
lm-format-enforcer --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run lm-format-enforcer -- --help --json

# Introspect command schema
agents-cli schema lm-format-enforcer --json

# Dry-run before executing
agents-cli run lm-format-enforcer -- <args> --dry-run
```
