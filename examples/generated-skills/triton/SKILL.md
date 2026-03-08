---
name: server
version: 0.0.0
description: "CLI tool: server. Use this skill when working with server-related tasks."
ingredients:
  - triton-inference-server/server
tags:
  - cli
---

# server

CLI tool: server

## Usage

```bash
# Show help
server --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run server -- --help --json

# Introspect command schema
agents-cli schema server --json

# Dry-run before executing
agents-cli run server -- <args> --dry-run
```
