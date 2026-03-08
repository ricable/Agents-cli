---
name: julep
version: 0.0.0
description: "CLI tool: julep. Use this skill when working with julep-related tasks."
ingredients:
  - julep-ai/julep
tags:
  - cli
---

# julep

CLI tool: julep

## Usage

```bash
# Show help
julep --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run julep -- --help --json

# Introspect command schema
agents-cli schema julep --json

# Dry-run before executing
agents-cli run julep -- <args> --dry-run
```
