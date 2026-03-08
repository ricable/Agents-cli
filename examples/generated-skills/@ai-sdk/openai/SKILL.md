---
name: @ai-sdk/openai
version: 3.0.41
description: "CLI tool: @ai-sdk/openai. Use this skill when working with @ai-sdk/openai-related tasks."
ingredients:
  - @ai-sdk/openai
tags:
  - cli
---

# @ai-sdk/openai

CLI tool: @ai-sdk/openai

## Usage

```bash
# Show help
@ai-sdk/openai --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run @ai-sdk/openai -- --help --json

# Introspect command schema
agents-cli schema @ai-sdk/openai --json

# Dry-run before executing
agents-cli run @ai-sdk/openai -- <args> --dry-run
```
