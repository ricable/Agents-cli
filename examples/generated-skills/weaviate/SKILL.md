---
name: weaviate
version: 0.0.0
description: "CLI tool: weaviate. Use this skill when working with weaviate-related tasks."
ingredients:
  - weaviate/weaviate
tags:
  - cli
---

# weaviate

CLI tool: weaviate

## Usage

```bash
# Show help
weaviate --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run weaviate -- --help --json

# Introspect command schema
agents-cli schema weaviate --json

# Dry-run before executing
agents-cli run weaviate -- <args> --dry-run
```
