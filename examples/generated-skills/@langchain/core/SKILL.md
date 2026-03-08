---
name: @langchain/core
version: 1.1.31
description: "CLI tool: @langchain/core. Use this skill when working with @langchain/core-related tasks."
ingredients:
  - @langchain/core
tags:
  - cli
---

# @langchain/core

CLI tool: @langchain/core

## Usage

```bash
# Show help
@langchain/core --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run @langchain/core -- --help --json

# Introspect command schema
agents-cli schema @langchain/core --json

# Dry-run before executing
agents-cli run @langchain/core -- <args> --dry-run
```
