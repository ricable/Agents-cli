---
name: modal-client
version: 0.0.0
description: "CLI tool: modal-client. Use this skill when working with modal-client-related tasks."
ingredients:
  - modal-labs/modal-client
tags:
  - cli
---

# modal-client

CLI tool: modal-client

## Usage

```bash
# Show help
modal-client --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run modal-client -- --help --json

# Introspect command schema
agents-cli schema modal-client --json

# Dry-run before executing
agents-cli run modal-client -- <args> --dry-run
```
