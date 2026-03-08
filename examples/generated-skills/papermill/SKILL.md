---
name: papermill
version: 0.0.0
description: "CLI tool: papermill. Use this skill when working with papermill-related tasks."
ingredients:
  - nteract/papermill
tags:
  - cli
---

# papermill

CLI tool: papermill

## Usage

```bash
# Show help
papermill --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run papermill -- --help --json

# Introspect command schema
agents-cli schema papermill --json

# Dry-run before executing
agents-cli run papermill -- <args> --dry-run
```
