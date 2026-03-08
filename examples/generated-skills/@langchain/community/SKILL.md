---
name: @langchain/community
version: 1.1.22
description: "CLI tool: @langchain/community. Use this skill when working with @langchain/community-related tasks."
ingredients:
  - @langchain/community
tags:
  - cli
---

# @langchain/community

CLI tool: @langchain/community

## Usage

```bash
# Show help
@langchain/community --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run @langchain/community -- --help --json

# Introspect command schema
agents-cli schema @langchain/community --json

# Dry-run before executing
agents-cli run @langchain/community -- <args> --dry-run
```
