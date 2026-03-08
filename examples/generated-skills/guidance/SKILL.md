---
name: guidance
version: 0.0.0
description: "CLI tool: guidance. Use this skill when working with guidance-related tasks."
ingredients:
  - guidance-ai/guidance
tags:
  - cli
---

# guidance

CLI tool: guidance

## Usage

```bash
# Show help
guidance --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run guidance -- --help --json

# Introspect command schema
agents-cli schema guidance --json

# Dry-run before executing
agents-cli run guidance -- <args> --dry-run
```
