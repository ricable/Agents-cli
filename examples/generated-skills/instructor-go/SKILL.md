---
name: instructor-go
version: 0.0.0
description: "CLI tool: instructor-go. Use this skill when working with instructor-go-related tasks."
ingredients:
  - instructor-ai/instructor-go
tags:
  - cli
---

# instructor-go

CLI tool: instructor-go

## Usage

```bash
# Show help
instructor-go --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run instructor-go -- --help --json

# Introspect command schema
agents-cli schema instructor-go --json

# Dry-run before executing
agents-cli run instructor-go -- <args> --dry-run
```
