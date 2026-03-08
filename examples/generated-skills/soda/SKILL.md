---
name: soda-core
version: 0.0.0
description: "CLI tool: soda-core. Use this skill when working with soda-core-related tasks."
ingredients:
  - sodadata/soda-core
tags:
  - cli
---

# soda-core

CLI tool: soda-core

## Usage

```bash
# Show help
soda-core --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run soda-core -- --help --json

# Introspect command schema
agents-cli schema soda-core --json

# Dry-run before executing
agents-cli run soda-core -- <args> --dry-run
```
