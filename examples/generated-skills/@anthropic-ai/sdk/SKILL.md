---
name: @anthropic-ai/sdk
version: 0.78.0
description: "The official TypeScript library for the Anthropic API. Use this skill when the user needs @anthropic-ai/sdk (commands: migrate), even if they don't mention "@anthropic-ai/sdk" explicitly."
ingredients:
  - @anthropic-ai/sdk
tags:
  - cli
# license: MIT
---

# @anthropic-ai/sdk

The official TypeScript library for the Anthropic API

## Commands

### `@anthropic-ai/sdk migrate`

Run migrations to update your code using @anthropic-ai/sdk@0.41 to be compatible with @anthropic-ai/sdk@0.50

## Usage

```bash
# Show help
@anthropic-ai/sdk --help

# Run migrations to update your code using @anthropic-ai/sdk@0.41 to be compatible with @anthropic-ai/sdk@0.50
@anthropic-ai/sdk migrate

```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run @anthropic-ai/sdk -- --help --json

# Introspect command schema
agents-cli schema @anthropic-ai/sdk --json

# Dry-run before executing
agents-cli run @anthropic-ai/sdk -- <args> --dry-run
```
