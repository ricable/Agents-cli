---
name: labelme
version: 0.0.0
description: "CLI tool: labelme. Use this skill when working with labelme-related tasks."
ingredients:
  - labelmeai/labelme
tags:
  - cli
---

# labelme

CLI tool: labelme

## Usage

```bash
# Show help
labelme --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run labelme -- --help --json

# Introspect command schema
agents-cli schema labelme --json

# Dry-run before executing
agents-cli run labelme -- <args> --dry-run
```
