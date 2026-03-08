---
name: trulens
version: 0.0.0
description: "CLI tool: trulens. Use this skill when working with trulens-related tasks."
ingredients:
  - truera/trulens
tags:
  - cli
---

# trulens

CLI tool: trulens

## Usage

```bash
# Show help
trulens --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run trulens -- --help --json

# Introspect command schema
agents-cli schema trulens --json

# Dry-run before executing
agents-cli run trulens -- <args> --dry-run
```
