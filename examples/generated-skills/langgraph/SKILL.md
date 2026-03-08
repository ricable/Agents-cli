---
name: langgraph
version: 0.0.0
description: "CLI tool: langgraph. Use this skill when working with langgraph-related tasks."
ingredients:
  - langchain-ai/langgraph
tags:
  - cli
---

# langgraph

CLI tool: langgraph

## Usage

```bash
# Show help
langgraph --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run langgraph -- --help --json

# Introspect command schema
agents-cli schema langgraph --json

# Dry-run before executing
agents-cli run langgraph -- <args> --dry-run
```
