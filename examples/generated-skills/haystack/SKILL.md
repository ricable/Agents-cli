---
name: haystack
version: 0.0.0
description: "CLI tool: haystack. Use this skill when working with haystack-related tasks."
ingredients:
  - deepset-ai/haystack
tags:
  - cli
---

# haystack

CLI tool: haystack

## Usage

```bash
# Show help
haystack --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run haystack -- --help --json

# Introspect command schema
agents-cli schema haystack --json

# Dry-run before executing
agents-cli run haystack -- <args> --dry-run
```
