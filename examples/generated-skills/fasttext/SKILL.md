---
name: fastText
version: 0.0.0
description: "CLI tool: fastText. Use this skill when working with fastText-related tasks."
ingredients:
  - facebookresearch/fastText
tags:
  - cli
---

# fastText

CLI tool: fastText

## Usage

```bash
# Show help
fastText --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run fastText -- --help --json

# Introspect command schema
agents-cli schema fastText --json

# Dry-run before executing
agents-cli run fastText -- <args> --dry-run
```
