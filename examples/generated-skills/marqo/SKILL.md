---
name: marqo
version: 0.0.0
description: "CLI tool: marqo. Use this skill when working with marqo-related tasks."
ingredients:
  - marqo-ai/marqo
tags:
  - cli
---

# marqo

CLI tool: marqo

## Usage

```bash
# Show help
marqo --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run marqo -- --help --json

# Introspect command schema
agents-cli schema marqo --json

# Dry-run before executing
agents-cli run marqo -- <args> --dry-run
```
