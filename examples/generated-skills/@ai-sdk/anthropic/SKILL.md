---
name: @ai-sdk/anthropic
version: 3.0.58
description: "CLI tool: @ai-sdk/anthropic. Use this skill when working with @ai-sdk/anthropic-related tasks."
ingredients:
  - @ai-sdk/anthropic
tags:
  - cli
---

# @ai-sdk/anthropic

CLI tool: @ai-sdk/anthropic

## Usage

```bash
# Show help
@ai-sdk/anthropic --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run @ai-sdk/anthropic -- --help --json

# Introspect command schema
agents-cli schema @ai-sdk/anthropic --json

# Dry-run before executing
agents-cli run @ai-sdk/anthropic -- <args> --dry-run
```
