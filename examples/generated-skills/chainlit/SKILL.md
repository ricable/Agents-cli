---
name: chainlit
version: 0.0.0
description: "CLI tool: chainlit. Use this skill when working with chainlit-related tasks."
ingredients:
  - Chainlit/chainlit
tags:
  - cli
---

# chainlit

CLI tool: chainlit

## Usage

```bash
# Show help
chainlit --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run chainlit -- --help --json

# Introspect command schema
agents-cli schema chainlit --json

# Dry-run before executing
agents-cli run chainlit -- <args> --dry-run
```
