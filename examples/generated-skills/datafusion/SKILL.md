---
name: datafusion
version: 0.0.0
description: "CLI tool: datafusion. Use this skill when working with datafusion-related tasks."
ingredients:
  - apache/datafusion
tags:
  - cli
---

# datafusion

CLI tool: datafusion

## Usage

```bash
# Show help
datafusion --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run datafusion -- --help --json

# Introspect command schema
agents-cli schema datafusion --json

# Dry-run before executing
agents-cli run datafusion -- <args> --dry-run
```
