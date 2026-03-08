---
name: promptflow
version: 0.0.0
description: "CLI tool: promptflow. Use this skill when working with promptflow-related tasks."
ingredients:
  - microsoft/promptflow
tags:
  - cli
---

# promptflow

CLI tool: promptflow

## Usage

```bash
# Show help
promptflow --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run promptflow -- --help --json

# Introspect command schema
agents-cli schema promptflow --json

# Dry-run before executing
agents-cli run promptflow -- <args> --dry-run
```
