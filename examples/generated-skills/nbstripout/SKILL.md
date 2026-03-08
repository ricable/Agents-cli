---
name: nbstripout
version: 0.0.0
description: "CLI tool: nbstripout. Use this skill when working with nbstripout-related tasks."
ingredients:
  - kynan/nbstripout
tags:
  - cli
---

# nbstripout

CLI tool: nbstripout

## Usage

```bash
# Show help
nbstripout --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run nbstripout -- --help --json

# Introspect command schema
agents-cli schema nbstripout --json

# Dry-run before executing
agents-cli run nbstripout -- <args> --dry-run
```
