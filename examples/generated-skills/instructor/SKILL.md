---
name: instructor
version: 0.0.0
description: "CLI tool: instructor. Use this skill when working with instructor-related tasks."
ingredients:
  - instructor-ai/instructor
tags:
  - cli
---

# instructor

CLI tool: instructor

## Usage

```bash
# Show help
instructor --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run instructor -- --help --json

# Introspect command schema
agents-cli schema instructor --json

# Dry-run before executing
agents-cli run instructor -- <args> --dry-run
```
