---
name: TaskWeaver
version: 0.0.0
description: "CLI tool: TaskWeaver. Use this skill when working with TaskWeaver-related tasks."
ingredients:
  - microsoft/TaskWeaver
tags:
  - cli
---

# TaskWeaver

CLI tool: TaskWeaver

## Usage

```bash
# Show help
TaskWeaver --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run TaskWeaver -- --help --json

# Introspect command schema
agents-cli schema TaskWeaver --json

# Dry-run before executing
agents-cli run TaskWeaver -- <args> --dry-run
```
