---
name: alignment-handbook
version: 0.0.0
description: "CLI tool: alignment-handbook. Use this skill when working with alignment-handbook-related tasks."
ingredients:
  - huggingface/alignment-handbook
tags:
  - cli
---

# alignment-handbook

CLI tool: alignment-handbook

## Usage

```bash
# Show help
alignment-handbook --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run alignment-handbook -- --help --json

# Introspect command schema
agents-cli schema alignment-handbook --json

# Dry-run before executing
agents-cli run alignment-handbook -- <args> --dry-run
```
