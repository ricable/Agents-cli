---
name: flyte
version: 0.0.0
description: "CLI tool: flyte. Use this skill when working with flyte-related tasks."
ingredients:
  - flyteorg/flyte
tags:
  - cli
---

# flyte

CLI tool: flyte

## Usage

```bash
# Show help
flyte --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run flyte -- --help --json

# Introspect command schema
agents-cli schema flyte --json

# Dry-run before executing
agents-cli run flyte -- <args> --dry-run
```
