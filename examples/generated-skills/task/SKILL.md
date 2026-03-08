---
name: task
version: 0.0.0
description: "CLI tool: task. Use this skill when working with task-related tasks."
ingredients:
  - go-task/task
tags:
  - cli
---

# task

CLI tool: task

## Usage

```bash
# Show help
task --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run task -- --help --json

# Introspect command schema
agents-cli schema task --json

# Dry-run before executing
agents-cli run task -- <args> --dry-run
```
