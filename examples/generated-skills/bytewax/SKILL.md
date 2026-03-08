---
name: bytewax
version: 0.0.0
description: "CLI tool: bytewax. Use this skill when working with bytewax-related tasks."
ingredients:
  - bytewax/bytewax
tags:
  - cli
---

# bytewax

CLI tool: bytewax

## Usage

```bash
# Show help
bytewax --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run bytewax -- --help --json

# Introspect command schema
agents-cli schema bytewax --json

# Dry-run before executing
agents-cli run bytewax -- <args> --dry-run
```
