---
name: docling
version: 0.0.0
description: "CLI tool: docling. Use this skill when working with docling-related tasks."
ingredients:
  - docling-project/docling
tags:
  - cli
---

# docling

CLI tool: docling

## Usage

```bash
# Show help
docling --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run docling -- --help --json

# Introspect command schema
agents-cli schema docling --json

# Dry-run before executing
agents-cli run docling -- <args> --dry-run
```
