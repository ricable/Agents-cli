---
name: rebuff
version: 0.0.0
description: "CLI tool: rebuff. Use this skill when working with rebuff-related tasks."
ingredients:
  - protectai/rebuff
tags:
  - cli
---

# rebuff

CLI tool: rebuff

## Usage

```bash
# Show help
rebuff --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run rebuff -- --help --json

# Introspect command schema
agents-cli schema rebuff --json

# Dry-run before executing
agents-cli run rebuff -- <args> --dry-run
```
