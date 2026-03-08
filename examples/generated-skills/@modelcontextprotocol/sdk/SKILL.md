---
name: @modelcontextprotocol/sdk
version: 1.27.1
description: "Model Context Protocol implementation for TypeScript. Use this skill when working with @modelcontextprotocol/sdk-related tasks."
ingredients:
  - @modelcontextprotocol/sdk
tags:
  - modelcontextprotocol
  - mcp
  - cli
# homepage: https://modelcontextprotocol.io
# license: MIT
---

# @modelcontextprotocol/sdk

Model Context Protocol implementation for TypeScript

**Source**: https://modelcontextprotocol.io

## Usage

```bash
# Show help
@modelcontextprotocol/sdk --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run @modelcontextprotocol/sdk -- --help --json

# Introspect command schema
agents-cli schema @modelcontextprotocol/sdk --json

# Dry-run before executing
agents-cli run @modelcontextprotocol/sdk -- <args> --dry-run
```
