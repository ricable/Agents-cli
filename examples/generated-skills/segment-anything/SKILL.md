---
name: segment-anything
version: 0.0.0
description: "CLI tool: segment-anything. Use this skill when working with segment-anything-related tasks."
ingredients:
  - facebookresearch/segment-anything
tags:
  - cli
---

# segment-anything

CLI tool: segment-anything

## Usage

```bash
# Show help
segment-anything --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run segment-anything -- --help --json

# Introspect command schema
agents-cli schema segment-anything --json

# Dry-run before executing
agents-cli run segment-anything -- <args> --dry-run
```
