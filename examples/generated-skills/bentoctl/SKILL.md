---
name: bentoctl
version: 0.0.0
description: "CLI tool: bentoctl. Use this skill when working with bentoctl-related tasks."
ingredients:
  - bentoml/bentoctl
tags:
  - cli
---

# bentoctl

CLI tool: bentoctl

## Usage

```bash
# Show help
bentoctl --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run bentoctl -- --help --json

# Introspect command schema
agents-cli schema bentoctl --json

# Dry-run before executing
agents-cli run bentoctl -- <args> --dry-run
```
