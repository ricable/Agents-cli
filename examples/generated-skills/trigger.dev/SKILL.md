---
name: trigger.dev
version: 0.0.1
description: "CLI tool: trigger.dev. Use this skill when working with trigger.dev-related tasks."
ingredients:
  - triggerdotdev/trigger.dev
tags:
  - cli
---

# trigger.dev

CLI tool: trigger.dev

## Usage

```bash
# Show help
trigger.dev --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run trigger.dev -- --help --json

# Introspect command schema
agents-cli schema trigger.dev --json

# Dry-run before executing
agents-cli run trigger.dev -- <args> --dry-run
```
