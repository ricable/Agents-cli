---
name: elasticsearch
version: 0.0.0
description: "CLI tool: elasticsearch. Use this skill when working with elasticsearch-related tasks."
ingredients:
  - elastic/elasticsearch
tags:
  - cli
---

# elasticsearch

CLI tool: elasticsearch

## Usage

```bash
# Show help
elasticsearch --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run elasticsearch -- --help --json

# Introspect command schema
agents-cli schema elasticsearch --json

# Dry-run before executing
agents-cli run elasticsearch -- <args> --dry-run
```
