---
name: @ai-sdk/google
version: 3.0.43
description: "CLI tool: @ai-sdk/google. Use this skill when working with @ai-sdk/google-related tasks."
ingredients:
  - @ai-sdk/google
tags:
  - cli
---

# @ai-sdk/google

CLI tool: @ai-sdk/google

## Usage

```bash
# Show help
@ai-sdk/google --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run @ai-sdk/google -- --help --json

# Introspect command schema
agents-cli schema @ai-sdk/google --json

# Dry-run before executing
agents-cli run @ai-sdk/google -- <args> --dry-run
```
