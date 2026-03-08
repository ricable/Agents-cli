---
name: @langchain/langgraph
version: 1.2.1
description: "CLI tool: @langchain/langgraph. Use this skill when working with @langchain/langgraph-related tasks."
ingredients:
  - @langchain/langgraph
tags:
  - cli
---

# @langchain/langgraph

CLI tool: @langchain/langgraph

## Usage

```bash
# Show help
@langchain/langgraph --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run @langchain/langgraph -- --help --json

# Introspect command schema
agents-cli schema @langchain/langgraph --json

# Dry-run before executing
agents-cli run @langchain/langgraph -- <args> --dry-run
```
